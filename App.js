/* eslint-disable global-require */
/* eslint-disable react/prop-types */
import React from 'react';
import { Alert, DeviceEventEmitter, Platform, StatusBar, StyleSheet, View, NativeModules } from 'react-native';
import { AppLoading, Asset, Font, Icon } from 'expo';
import * as firebase from 'firebase';
import AppNavigator from './navigation/AppNavigator';
import LoginScreen from './screens/LoginScreen';
import Beacons from 'react-native-beacons-manager';
import moment from 'moment';
import { hashCode, deepCopyBeaconsLists } from './utils/helpers';
import { InAppNotificationProvider, withInAppNotification } from 'react-native-in-app-notification';

// uuid of YOUR BEACON (change to yours)
const UUID = 'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0';
const IDENTIFIER = 'Sena';
const TIME_FORMAT = 'HH:mm:ss';
const EMPTY_BEACONS_LISTS = {
  rangingList: [],
  monitorEnterList: [],
  monitorExitList: [],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

function shuffle(a) {
  var j, x, i;
  for (i = a.length - 1; i > 0; i--) {
      j = Math.floor(Math.random() * (i + 1));
      x = a[i];
      a[i] = a[j];
      a[j] = x;
  }
  return a;
}

const region = {
  identifier: 'Gatespace',
  uuid: 'E2C56DB5-DFFB-48D2-B060-D0F5A71096E0'
};

class App extends React.Component {
  // will be set as list of beacons to update state
  _beaconsLists = null;

  // will be set as a reference to "beaconsDidRange" event:
  beaconsDidRangeEvent = null;
  // will be set as a reference to "regionDidEnter" event:
  regionDidEnterEvent = null;
  // will be set as a reference to "regionDidExit" event:
  regionDidExitEvent = null;
  // will be set as a reference to "authorizationStatusDidChange" event:
  authStateDidRangeEvent = null;
  
  constructor(props) {
    super(props);
    this.state = {
      isLoadingComplete: false,
      isAuthenticated: false,
      isAuthenticationReady: false,
      uuid: UUID,
      identifier: IDENTIFIER,
      userNear: false,
      // check bluetooth state:
      bluetoothState: '',
      showad: true,
      near: false,
      message: '',
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

  registerForPushNotificationsAsync = async () => {
    if (Constants.isDevice) {
      const { status: existingStatus } = await Permissions.getAsync(
        Permissions.NOTIFICATIONS
      );
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Permissions.askAsync(
          Permissions.NOTIFICATIONS
        );
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }
      let token = await Notifications.getExpoPushTokenAsync();
      console.log(token);
    } else {
      alert('Must use physical device for Push Notifications');
    }
  };

  componentWillUnMount() {
    const { uuid, identifier } = this.state;

    const region = { identifier, uuid }; // minor and major are null here

    // stop monitoring beacons:
    Beacons.stopMonitoringForRegion(region)
      .then(() => console.log('Beacons monitoring stopped succesfully'))
      .catch(error =>
        console.log(`Beacons monitoring not stopped, error: ${error}`),
      );

    // stop ranging beacons:
    Beacons.stopRangingBeaconsInRegion(region)
      .then(() => console.log('Beacons ranging stopped succesfully'))
      .catch(error =>
        console.log(`Beacons ranging not stopped, error: ${error}`),
      );

    // stop updating locationManager:
    Beacons.stopUpdatingLocation();
    // remove auth state event we registered at componentDidMount:
    this.authStateDidRangeEvent.remove();
    // remove monitiring events we registered at componentDidMount::
    this.regionDidEnterEvent.remove();
    this.regionDidExitEvent.remove();
    // remove ranging event we registered at componentDidMount:
    this.beaconsDidRangeEvent.remove();
  }

  trackUser() {
    this._beaconsLists = EMPTY_BEACONS_LISTS;
    const { identifier, uuid, user } = this.state;
    // MANDATORY: you have to request ALWAYS Authorization (not only when in use) when monitoring
    // you also have to add "Privacy - Location Always Usage Description" in your "Info.plist" file
    // otherwise monitoring won't work
    Beacons.requestAlwaysAuthorization();
    Beacons.shouldDropEmptyRanges(true);
    // Define a region which can be identifier + uuid,
    // identifier + uuid + major or identifier + uuid + major + minor
    // (minor and major properties are numbers)
    const region = { identifier, uuid };
    // Monitor for beacons inside the region
    Beacons.startMonitoringForRegion(region) // or like  < v1.0.7: .startRangingBeaconsInRegion(identifier, uuid)
      .then(() => console.log('Beacons monitoring started succesfully'))
      .catch(error =>
        console.log(`Beacons monitoring not started, error: ${error}`),
      );

    // Range for beacons inside the region
    Beacons.startRangingBeaconsInRegion(region) // or like  < v1.0.7: .startRangingBeaconsInRegion(identifier, uuid)
      .then(() => console.log('Beacons ranging started succesfully'))
      .catch(error =>
        console.log(`Beacons ranging not started, error: ${error}`),
      );

    // update location to be able to monitor:
    Beacons.startUpdatingLocation();

    // OPTIONAL: listen to authorization change
    this.authStateDidRangeEvent = Beacons.BeaconsEventEmitter.addListener(
      'authorizationStatusDidChange',
      info => console.log('authorizationStatusDidChange: ', info),
    );

    // Ranging: Listen for beacon changes
    this.beaconsDidRangeEvent = Beacons.BeaconsEventEmitter.addListener(
      'beaconsDidRange',
      data => {
        this.setState({ message: 'beaconsDidRange event' });
        data.beacons.forEach(event => {
          console.log(event)
          let code = 'none';

          if(event.proximity !== "unknown" && (event.proximity === 'near' || event.proximity === 'far' || event.proximity === 'immediate')){

            
            var firstPart = (Math.random() * 46656) | 0;
            var secondPart = (Math.random() * 46656) | 0;
            firstPart = ("000" + firstPart.toString(36)).slice(-3);
            secondPart = ("000" + secondPart.toString(36)).slice(-3);
            code = firstPart + secondPart;

           
            if(event.proximity === 'far'){
              
              this.setState({
                showad: true,
                near: false
              })
              firebase.database().ref('game').update({
                distance: 'far'
              })
            }
            if(event.proximity === 'near' && this.state.showad === true){
              this.setState({
                showad: false,
                near: true
              })

              firebase.database().ref('game').update({
                distance: 'near'
              })
              Alert.alert( 'COME CLOSER TO GET A COUPON',
              'Product discount here',
              [
                {text: 'Redeem coupon', onPress: () => console.log('Ask me later pressed')},
                {
                  text: 'Cancel',
                  onPress: () => console.log('Cancel Pressed'),
                  style: 'cancel',
                },
                {text: 'Redeem coupon', onPress: () => console.log('OK Pressed')},
              ],
              {cancelable: false},)
            }
            if(event.proximity === 'immediate'  && this.state.near === true){
              this.setState({
                showad: false,
                near: false
              })
              const products = ['https://assets.adidas.com/images/w_600,f_auto,q_auto/d4dd2144b22b41bfbbd5a7ff01674bb3_9366/Superstar_Shoes_White_C77153_01_standard.jpg', 'https://m.media-amazon.com/images/G/01/zappos/landing/pages/adidas/Aug18/4368111._CB1533590374_.jpg', 'https://www.flightclub.com/media/catalog/product/cache/1/image/1600x1140/9df78eab33525d08d6e5fb8d27136e95/2/0/201357_01.jpg','https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR6ydiNyA-5CC6Wu6b_nrh0x_Fl979wd0pAaodWBX87kKAKPMcXMA']
              const choose = shuffle(products)
           
              firebase.database().ref('game').update({
                distance: 'close',
                image: choose,
                coupon: code
              })
              Alert.alert( 'CONGRATS HERE IS YOUR COUPON',
              'COUP1095',
              [
                {text: 'USE IT', onPress: () => console.log('OK Pressed')},
              ],
              {cancelable: false},)
            }
            const time = moment().format(TIME_FORMAT);
            var key = firebase.database().ref('events').push().getKey();
            firebase.database().ref('users').child('user').child('events').update({
              [key]: true
            })
            firebase.database().ref('events').child(key).update({
              ...event,
              time: time,
              code
            })
          }
          // Generate a reference to a new location and add some data using push()
        })
      },
    );

    // monitoring events
    this.regionDidEnterEvent = Beacons.BeaconsEventEmitter.addListener(
      'regionDidEnter',
      ({ uuid, identifier }) => {
        this.setState({ message: 'regionDidEnter event' });
        console.log('regionDidEnter, data: ', { uuid, identifier });
        const time = moment().format(TIME_FORMAT);
      },
    );

    this.regionDidExitEvent = Beacons.BeaconsEventEmitter.addListener(
      'regionDidExit',
      ({ identifier, uuid, minor, major }) => {
        this.setState({ message: 'regionDidExit event' });
        const time = moment().format(TIME_FORMAT);
        console.log('regionDidExit, data: ', {
          identifier,
          uuid,
          minor,
          major,
          time
        });
      },
    );
  }
  onAuthStateChanged = user => {
    this.setState({
      isAuthenticationReady: true,
      isAuthenticated: !!user,
      user: user
    });
    if(user){
      console.log(user);
      this.trackUser();
    }
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
        {isAuthenticated ? <InAppNotificationProvider><AppNavigator /></InAppNotificationProvider> : <LoginScreen />}
      </View>
    );
  }
}

export default withInAppNotification(App);