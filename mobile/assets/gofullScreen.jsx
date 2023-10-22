import Svg, { Path } from 'react-native-svg';

export default function GoFullscreen(props) {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" {...props}>
      <Path fill="#ffffff" d="M208 48V16H16v192h32V70.627l160.687 160.686l22.626-22.626L70.627 48H208zm256 256v137.373L299.313 276.687l-22.626 22.626L441.373 464H304v32h192V304h-32z"></Path>
    </Svg>
  );
}