declare module 'react-native-onboarding-swiper' {
  import { Component } from 'react';
  import { ViewStyle, TextStyle, ImageStyle } from 'react-native';

  export interface OnboardingPage {
    backgroundColor?: string;
    image?: React.ReactElement;
    title?: string;
    subtitle?: string;
    titleStyles?: TextStyle;
    subTitleStyles?: TextStyle;
  }

  export interface OnboardingProps {
    pages: OnboardingPage[];
    onSkip?: () => void;
    onDone?: () => void;
    showSkip?: boolean;
    showNext?: boolean;
    showDone?: boolean;
    skipLabel?: string;
    nextLabel?: string;
    doneLabel?: string;
    skipToPage?: number;
    bottomBarHeight?: number;
    bottomBarColor?: string;
    controlStatusBar?: boolean;
    pageIndexCallback?: (pageIndex: number) => void;
    flatlistProps?: any;
    SkipButtonComponent?: React.ComponentType<any>;
    NextButtonComponent?: React.ComponentType<any>;
    DoneButtonComponent?: React.ComponentType<any>;
    DotComponent?: React.ComponentType<any>;
    containerStyles?: ViewStyle;
    imageContainerStyles?: ViewStyle;
    titleStyles?: TextStyle;
    subTitleStyles?: TextStyle;
  }

  export default class Onboarding extends Component<OnboardingProps> {}
}
