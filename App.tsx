import {useRef, useState} from 'react';
import {Button} from 'react-native';
import axios from 'axios';

import IziPayWebviewScreen from './src/Izipay.webview';

export const MERCHANT_CODE = '4004345';
export const PUBLIC_KEY = 'VErethUtraQuxas57wuMuquprADrAHAb';
export const ORDER_CURRENCY = 'PEN';
export const REQUEST_SOURCE = 'ECOMMERCE';

interface IResponseToken {
  code: string;
  message: string;
  response: IResponse;
}

interface IResponse {
  token: string;
  userOrg: string;
  userScoring: string;
}

const ApiIzipay = axios.create({
  baseURL: 'https://sandbox-api-pw.izipay.pe:443',
});

const GENERATE_ORDER = () => {
  const currentTimeUnix = Math.floor(Date.now()) * 1000;

  return {
    currentTimeUnix,
    transactionId: currentTimeUnix.toString().slice(0, 14),
    orderNumber: currentTimeUnix.toString().slice(0, 10).toString(),
  };
};

const GET_TOKEN_SESSION = async (
  transactionId: string,
  orderNumber: string,
  amount: string,
) => {
  const amountDecimal = String(parseFloat(amount).toFixed(2));
  const headers = {
    'Content-Type': 'application/json',
    transactionId: transactionId,
  };

  const data = {
    requestSource: REQUEST_SOURCE,
    merchantCode: MERCHANT_CODE,
    orderNumber,
    publicKey: PUBLIC_KEY,
    amount: amountDecimal,
  };

  const response = await ApiIzipay.post<IResponseToken>(
    '/security/v1/Token/Generate',
    data,
    {
      headers,
    },
  );
  console.log('RESPONSE', JSON.stringify(response.data, null, 2));
  return response.data;
};

const useIziPay = () => {
  const dataOrderIziPay = useRef<any>();
  const tokenIziPay = useRef<any>();

  const fetchIziPay = async () => {
    try {
      const getDataOrder = GENERATE_ORDER();
      dataOrderIziPay.current = getDataOrder;
      const getToken = await GET_TOKEN_SESSION(
        getDataOrder.transactionId,
        getDataOrder.orderNumber,
        '10',
      );
      tokenIziPay.current = getToken.response.token;
      return {status: true};
    } catch (error) {
      return {status: false};
    }
  };

  return {
    fetchIziPay,
    dataOrderIziPay,
    tokenIziPay,
  };
};

const App = () => {
  const {fetchIziPay, dataOrderIziPay, tokenIziPay} = useIziPay();

  const [showWebview, setShowWebview] = useState(false);

  const init = async () => {
    const {status} = await fetchIziPay();
    if (!status) return;
    setShowWebview(true);
  };

  return (
    <>
      <Button
        title="Mostrar Izipay"
        onPress={() => init()}
        disabled={showWebview}
      />
      {showWebview ? (
        <IziPayWebviewScreen
          amount="10"
          token={tokenIziPay.current}
          transactionId={dataOrderIziPay.current.transactionId}
          orderNumber={dataOrderIziPay.current.orderNumber}
          currentTimeUnix={dataOrderIziPay.current.currentTimeUnix}
          onRequestClose={() => setShowWebview(false)}
        />
      ) : null}
    </>
  );
};

export default App;
