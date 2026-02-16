import Toast from 'react-native-root-toast';
import Colors from '../constants/Colors';

const showMessage = (msg, type = 'success') => {
    Toast.show(msg, {
        duration: Toast.durations.LONG,
        position: Toast.positions.TOP + 40,
        shadow: true,
        animation: true,
        hideOnPress: true,
        delay: 0,
        backgroundColor: type === 'error' ? '#FF5252' : (type === 'success' ? '#4CAF50' : '#333'),
        textColor: '#ffffff',
        opacity: 1,
        containerStyle: {
            borderRadius: 25,
            paddingHorizontal: 20,
            marginTop: 10
        }
    });
};

export default showMessage;
