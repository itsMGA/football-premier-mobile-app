// SharedComponents.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    TextInput,
    View,
    Animated,
} from 'react-native';

interface AnimatedInputProps {
    value: string;
    onChangeText: (text: string) => void;
    placeholder: string;
    secureTextEntry?: boolean;
    keyboardType?: 'default' | 'email-address';
    error?: boolean;
}

export const AnimatedInput: React.FC<AnimatedInputProps> = ({
    value,
    onChangeText,
    placeholder,
    secureTextEntry,
    keyboardType,
    error,
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const animatedIsFocused = useRef(new Animated.Value(value === '' ? 0 : 1)).current;

    useEffect(() => {
        Animated.timing(animatedIsFocused, {
            toValue: (isFocused || value !== '') ? 1 : 0,
            duration: 200,
            useNativeDriver: false,
        }).start();
    }, [animatedIsFocused, isFocused, value]);

    const labelStyle = {
        position: 'absolute',
        left: 16,
        top: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [18, -10],
        }),
        fontSize: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [16, 12],
        }),
        color: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: ['rgba(255, 255, 255, 0.5)', '#ffffff'],
        }),
        backgroundColor: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: ['transparent', 'rgba(0, 100, 0, 0.8)'],
        }),
        paddingHorizontal: animatedIsFocused.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 4],
        }),
        borderRadius: 4,
    };

    return (
        <View style={[styles.inputContainer, error && styles.inputContainerError]}>
            <Animated.Text style={labelStyle as any}>
                {placeholder}
            </Animated.Text>
            <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChangeText}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                secureTextEntry={secureTextEntry}
                keyboardType={keyboardType}
                blurOnSubmit
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
        </View>
    );
};

interface ErrorMessageProps {
    errors: string[];
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ errors }) => {
    return (
        <View style={styles.errorContainer}>
            {errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                    {error}
                </Text>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    inputContainer: {
        marginBottom: 20,
        borderBottomWidth: 2,
        borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    },
    inputContainerError: {
        borderBottomColor: '#ff3333',
    },
    input: {
        height: 40,
        fontSize: 16,
        color: '#ffffff',
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    errorContainer: {
        marginBottom: 10,
    },
    errorText: {
        color: '#FF6347',
        fontSize: 14,
        marginLeft: 16,
    },
});