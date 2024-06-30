import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import HomeScreen from "./screens/HomeScreen";
import GameScreen from "./screens/GameScreen";
import MultiplayerGameScreen from "./screens/MultiplayerGameScreen";

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: "Jotto" }}
        />
        <Stack.Screen
          name="Game"
          component={GameScreen}
          options={{ title: "Single Player" }}
        />
        <Stack.Screen
          name="MultiplayerGame"
          component={MultiplayerGameScreen}
          options={{ title: "Multiplayer" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
