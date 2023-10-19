import { Pressable} from 'react-native';
import Svg, { Path } from 'react-native-svg';


export default function PlayerSkipBtn(props) {
    return (
      <Pressable onPress={props.onPress}>
        <Svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" {...props}>
          <Path fill="#ffffff" d="m6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"></Path>
        </Svg>
      </Pressable>
    )
}
