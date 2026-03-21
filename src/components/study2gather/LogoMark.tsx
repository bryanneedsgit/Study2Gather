import { Image, StyleSheet, View } from "react-native";
import { sg } from "@/theme/study2gatherUi";

const LOGO = require("../../../assets/images/study2gather-logo.jpg");

type Props = {
  size?: number;
};

export function LogoMark({ size = 88 }: Props) {
  return (
    <View style={[styles.glow, { width: size + 24, height: size + 24 }]}>
      <Image source={LOGO} style={[styles.img, { width: size, height: size, borderRadius: size / 4 }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: sg.cyan,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8
  },
  img: {
    borderWidth: 2,
    borderColor: "rgba(74, 222, 128, 0.45)"
  }
});
