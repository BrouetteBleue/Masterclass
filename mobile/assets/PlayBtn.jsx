import Svg, { Path } from 'react-native-svg';

export default function PlayBtn(props) {
  return (
    <Svg width="30" height="30" viewBox="0 0 24 24" {...props}>
      <Path fill="black" d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8s8-3.59 8-8s-3.59-8-8-8zM9.5 16.5v-9l7 4.5l-7 4.5z" opacity=".3"></Path><Path fill="#ffffff" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8s8 3.59 8 8s-3.59 8-8 8z"></Path><Path fill="#ffffff" d="m9.5 16.5l7-4.5l-7-4.5z"></Path>
    </Svg>
  );
}

