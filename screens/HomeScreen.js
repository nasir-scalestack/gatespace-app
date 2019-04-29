/* eslint-disable global-require */
import React, { Component } from 'react';
import { Image } from 'react-native';
import {
  Container,
  Header,
  View,
  DeckSwiper,
  Card,
  CardItem,
  Thumbnail,
  Text,
  Left,
  Body,
  Icon,
} from 'native-base';

const cards = [
  {
    text: 'Product One',
    name: 'One',
    image: require('../assets/images/shoe1.png'),
  },
  {
    text: 'Product Two',
    name: 'Two',
    image: require('../assets/images/shoe2.png'),
  },
  {
    text: 'Product Three',
    name: 'Three',
    image: require('../assets/images/shoe3.png'),
  },
];
export default class HomeScreen extends Component {
  static navigationOptions = {
    header: null,
  };

  render() {
    return (
      <Container>
        <Header />
        <View>
          <DeckSwiper
            dataSource={cards}
            renderItem={item => (
              <Card style={{ elevation: 3 }}>
                <CardItem>
                  <Left>
                    <Thumbnail source={item.image} />
                    <Body>
                      <Text>{item.text}</Text>
                      <Text note>Gatespace</Text>
                    </Body>
                  </Left>
                </CardItem>
                <CardItem cardBody>
                  <Image style={{ height: 300, flex: 1 }} source={item.image} />
                </CardItem>
                <CardItem>
                  <Icon name="heart" style={{ color: '#ED4A6A' }} />
                  <Text>{item.name}</Text>
                </CardItem>
              </Card>
            )}
          />
        </View>
      </Container>
    );
  }
}
