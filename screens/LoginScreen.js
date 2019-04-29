/* eslint-disable react/prop-types */
import React from 'react';
import { StyleSheet, Alert, Text } from 'react-native';
import {
  Container,
  Header,
  Button,
  Content,
  Form,
  Item,
  Input,
  View,
} from 'native-base';
import { NavigationActions } from 'react-navigation';
import * as firebase from 'firebase';

export default class LoginScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: '',
      password: '',
    };
  }

  onLoginPress = () => {
    const { email, password } = this.state;
    firebase
      .auth()
      .signInWithEmailAndPassword(email, password)
      .then(
        () => {},
        error => {
          Alert.alert(error.message);
        }
      );
  };

  onCreateAccountPress = () => {
    const { navigation } = this.props;
    const navActions = NavigationActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: 'Signup' })],
    });
    navigation.dispatch(navActions);
  };

  render() {
    const { email, password } = this.state;
    return (
      <Container>
        <Header />
        <Content padder>
          <Form>
            <Item last>
              <Input
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                onChangeText={text => this.setState({ email: text })}
                placeholder="Email"
                value={email}
              />
            </Item>
            <Item last>
              <Input
                autoCapitalize="none"
                autoCorrect={false}
                secureTextEntry
                onChangeText={text => this.setState({ password: text })}
                placeholder="Password"
                value={password}
              />
            </Item>
            <View padder>
              <Button full primary onPress={this.onLoginPress}>
                <Text>Login</Text>
              </Button>
              <Button
                style={{ marginTop: 10 }}
                full
                light
                onPress={this.onCreateAccountPress}
              >
                <Text>Create Account...</Text>
              </Button>
            </View>
          </Form>
        </Content>
      </Container>
    );
  }
}

const styles = StyleSheet.create({});
