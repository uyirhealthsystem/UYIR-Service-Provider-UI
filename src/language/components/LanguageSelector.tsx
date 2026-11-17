import { Pressable, Text, View } from "react-native";
import { languages } from "../config";
import { useLanguage } from "../index";

export default function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  return (
    <View style={{ alignItems: "flex-end" }}>
      <Pressable
        onPress={() => {
          const next = language === "en" ? "ta" : "en";
          setLanguage(next);
        }}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderWidth: 1,
          borderColor: "#E1E5EC",
          borderRadius: 20,
        }}
      >
        <Text style={{ fontSize: 16 }}>🌐</Text>

        <Text style={{ marginLeft: 6, color: "#173FD1", fontWeight: "600" }}>
          {languages[language]}
        </Text>

        <Text style={{ marginLeft: 5 }}>⌄</Text>
      </Pressable>
    </View>
  );
}
