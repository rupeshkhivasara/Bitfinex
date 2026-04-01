import { Button, View } from "react-native";
import { useDispatch } from "react-redux";
import OrderBook from "../src/components/OrderBook";
import { connectWS, disconnectWS } from "../src/services/websocket";

export default function Home() {
  const dispatch = useDispatch();

  const handleConnect = () => {
    connectWS((data) => {
      dispatch({ type: "WS_MESSAGE", payload: data });
    });
  };

  const handleDisconnect = () => {
    disconnectWS();
  };

  return (
    <View style={{ flex: 1, paddingTop: 40 }}>
      <Button title="Connect" onPress={handleConnect} />
      <Button title="Disconnect" onPress={handleDisconnect} />

      <OrderBook />
    </View>
  );
}