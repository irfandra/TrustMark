import { Image, TouchableOpacity, View } from "react-native";
import { useRole } from '../../components/context/RoleContext';

export default function TabRoleToggle() {
  const { role, setRole } = useRole();
  const userImage    = "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/XFzS8cy7qn/4csdcmha_expires_30_days.png";
  const companyImage = "https://storage.googleapis.com/tagjs-prod.appspot.com/v1/XFzS8cy7qn/zljzv37i_expires_30_days.png";

  const Button = ({ value, image }) => (
    <TouchableOpacity
      onPress={() => {
        console.log('Pressed', value);
        setRole(value);
      }}
      style={{
        backgroundColor: role === value ? "#000000" : "transparent",
        borderRadius: 50,
        paddingVertical: 8,
        paddingHorizontal: 20,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Image
        source={{ uri: image }}
        resizeMode="contain"           // ← changed from "stretch"
        style={{
          width: 24,
          height: 24,
          opacity: role === value ? 1 : 0.5,
        }}
      />
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        alignSelf: "flex-start",       // ← prevents stretching full width
        borderColor: "#8F8F8F",
        borderRadius: 50,
        borderWidth: 1,
        padding: 4,
      }}
    >
      <Button value="user"    image={userImage} />
      <Button value="company" image={companyImage} />
    </View>
  );
}
