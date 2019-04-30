/* eslint-disable global-require */
/* eslint-disable react/prop-types */
import React from 'react';
import { DeviceEventEmitter, Platform, StatusBar, StyleSheet, View, NativeModules } from 'react-native';
import { AppLoading, Asset, Font, Icon } from 'expo';
import * as firebase from 'firebase';
import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

const region = {
  identifier: 'Gatespace',
  uuid: 'B9407F30-F5F8-466E-AFF9-25556B57FE6D'
};

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoadingComplete: false,
      isAuthenticated: false,
      isAuthenticationReady: false,
    };

    if (!firebase.apps.length) {
      firebase.initializeApp({
        apiKey: 'AIzaSyA-eJKwGNj1qBoGK-6YPh18BOpR555jjs4',
        authDomain: 'ap1-demo-app.firebaseapp.com',
        databaseURL: 'https://ap1-demo-app.firebaseio.com',
        projectId: 'ap1-demo-app',
        storageBucket: 'ap1-demo-app.appspot.com',
        messagingSenderId: '685927665140',
      });
    }
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged);
  }

  onAuthStateChanged = user => {
    this.setState({
      isAuthenticationReady: true,
      isAuthenticated: !!user,
    });
  };

  _loadResourcesAsync = async () =>
    Promise.all([
      Asset.loadAsync([
        require('./assets/images/robot-dev.png'),
        require('./assets/images/robot-prod.png'),
      ]),
      Font.loadAsync({
        // This is the font that we are using for our tab bar
        ...Icon.Ionicons.font,
        // We include SpaceMono because we use it in HomeScreen.js. Feel free
        // to remove this if you are not using it in your app
        'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
      }),
    ]);

  _handleLoadingError = error => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };

  render() {
    const {
      isLoadingComplete,
      isAuthenticationReady,
      isAuthenticated,
    } = this.state;
    const { skipLoadingScreen } = this.props;

    if ((!isLoadingComplete || !isAuthenticationReady) && !skipLoadingScreen) {
      return (
        <AppLoading
          startAsync={this._loadResourcesAsync}
          onError={this._handleLoadingError}
          onFinish={this._handleFinishLoading}
        />
      );
    }
    return (
      <View style={styles.container}>
        {Platform.OS === 'ios' && <StatusBar barStyle="default" />}
        {isAuthenticated ? <AppNavigator /> : <LoginScreen />}
      </View>
    );
  }
}
