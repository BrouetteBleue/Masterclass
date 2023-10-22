import Svg, { Path } from 'react-native-svg';

export default function ExitFullScreen(props) {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" {...props}>
      <Path fill="#ffffff" d="M204 181.372L38.628 16H16v22.628L181.372 204H44v32h192V44h-32v137.372zM326.628 304H464v-32H272v192h32V326.628L473.372 496H496v-22.628L326.628 304z"></Path>
    </Svg>
  );
}

