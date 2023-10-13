import Svg, { Path } from 'react-native-svg';


export default function PlayerPlayBtn(props) {
    return (
      <Svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" {...props}>
        <Path fill="#ffffff" d="M8 5v14l11-7z"></Path>
      </Svg>
    )
}