import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    Alert,
} from 'react-native';
import axiosInstance from '../axiosConfig';

interface FriendliesComponentProps {
    visible: boolean;
    onClose: () => void;
    onNotificationUpdate: () => void;
}

interface FriendlyChallenge {
    id: number;
    challenger: string;
    challenged: string;
    proposed_date: string;
    status: string;
}

const FriendliesComponent: React.FC<FriendliesComponentProps> = ({ visible, onClose, onNotificationUpdate }) => {
    const [friendlyChallenges, setFriendlyChallenges] = useState<FriendlyChallenge[]>([]);

    useEffect(() => {
        if (visible) {
            fetchFriendlyChallenges();
        }
    }, [visible]);

    const fetchFriendlyChallenges = async () => {
        try {
            const response = await axiosInstance.get('/matches/friendly-challenges/');
            setFriendlyChallenges(response.data.received_challenges.concat(response.data.sent_challenges));
        } catch (error) {
            console.error('Error fetching friendly challenges:', error);
            Alert.alert('Error', 'Failed to fetch friendly challenges');
        }
    };

    const createFriendlyChallenge = async () => {
        try {
            const response = await axiosInstance.post('/matches/friendly-challenges/create/', {
                challenged_team_id: 1, // Replace with actual team selection logic
                proposed_date: new Date().toISOString(),
            });
            Alert.alert('Success', 'Friendly challenge created successfully');
            fetchFriendlyChallenges();
            onNotificationUpdate();
        } catch (error) {
            console.error('Error creating friendly challenge:', error);
            Alert.alert('Error', 'Failed to create friendly challenge');
        }
    };

    const respondToChallenge = async (challengeId: number, response: 'accept' | 'decline') => {
        try {
            await axiosInstance.post(`/matches/friendly-challenges/${challengeId}/respond/`, { response });
            Alert.alert('Success', `Challenge ${response}ed successfully`);
            fetchFriendlyChallenges();
            onNotificationUpdate();
        } catch (error) {
            console.error('Error responding to challenge:', error);
            Alert.alert('Error', 'Failed to respond to challenge');
        }
    };

    const simulateMatch = async (matchId: number) => {
        try {
            const response = await axiosInstance.post('/engine/simulate-match/', { match_id: matchId });
            Alert.alert('Match Simulated', `Result: ${response.data.score[0]} - ${response.data.score[1]}`);
            fetchFriendlyChallenges();
            onNotificationUpdate();
        } catch (error) {
            console.error('Error simulating match:', error);
            Alert.alert('Error', 'Failed to simulate match');
        }
    };

    return (
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Friendly Matches</Text>
                    <TouchableOpacity style={styles.button} onPress={createFriendlyChallenge}>
                        <Text style={styles.buttonText}>Create Friendly Challenge</Text>
                    </TouchableOpacity>
                    <ScrollView>
                        {friendlyChallenges.map((challenge) => (
                            <View key={challenge.id} style={styles.challengeItem}>
                                <Text>{challenge.challenger} vs {challenge.challenged}</Text>
                                <Text>Date: {new Date(challenge.proposed_date).toLocaleDateString()}</Text>
                                <Text>Status: {challenge.status}</Text>
                                {challenge.status === 'PENDING' && (
                                    <View style={styles.challengeActions}>
                                        <TouchableOpacity
                                            style={[styles.button, styles.acceptButton]}
                                            onPress={() => respondToChallenge(challenge.id, 'accept')}
                                        >
                                            <Text style={styles.buttonText}>Accept</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[styles.button, styles.declineButton]}
                                            onPress={() => respondToChallenge(challenge.id, 'decline')}
                                        >
                                            <Text style={styles.buttonText}>Decline</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                                {challenge.status === 'ACCEPTED' && (
                                    <TouchableOpacity
                                        style={[styles.button, styles.simulateButton]}
                                        onPress={() => simulateMatch(challenge.id)}
                                    >
                                        <Text style={styles.buttonText}>Simulate Match</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        ))}
                    </ScrollView>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 20,
        width: '90%',
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginVertical: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    challengeItem: {
        backgroundColor: '#F5F5F5',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
    },
    challengeActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
        flex: 1,
        marginRight: 5,
    },
    declineButton: {
        backgroundColor: '#F44336',
        flex: 1,
        marginLeft: 5,
    },
    simulateButton: {
        backgroundColor: '#2196F3',
    },
    closeButton: {
        backgroundColor: '#757575',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginTop: 20,
    },
});

export default FriendliesComponent;