import Svg, { Path } from 'react-native-svg';

export default function NoSound(props) {
  return (
    <Svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" {...props}>
      <Path fill="#ffffff" d="M15.4 16L14 14.6l2.6-2.6L14 9.4L15.4 8l2.6 2.6L20.6 8L22 9.4L19.4 12l2.6 2.6l-1.4 1.4l-2.6-2.6l-2.6 2.6ZM3 15V9h4l5-5v16l-5-5H3Z"></Path>
    </Svg>
  );
}
