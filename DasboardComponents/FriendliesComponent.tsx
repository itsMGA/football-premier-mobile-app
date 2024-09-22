import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    TextInput,
    FlatList,
    Modal,
    SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axiosInstance from '../axiosConfig';

interface FriendliesComponentProps {
    onNotificationUpdate: () => void;
}

interface FriendlyChallenge {
    id: number;
    challenger?: string;
    challenged: string;
    proposed_date: string;
    status: string;
}

interface Team {
    id: number;
    name: string;
    division: string;
    country: string;
}

const FriendliesComponent: React.FC<FriendliesComponentProps> = ({ onNotificationUpdate }) => {
    const [friendlyMatches, setFriendlyMatches] = useState<FriendlyChallenge[]>([]);
    const [receivedChallenges, setReceivedChallenges] = useState<FriendlyChallenge[]>([]);
    const [sentChallenges, setSentChallenges] = useState<FriendlyChallenge[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [proposedDate, setProposedDate] = useState('');
    const [isModalVisible, setIsModalVisible] = useState(false);

    useEffect(() => {
        fetchFriendlyMatches();
        fetchFriendlyChallenges();
    }, []);

    const fetchFriendlyMatches = async () => {
        try {
            const response = await axiosInstance.get('matches/get/?type=FRIENDLY');
            setFriendlyMatches(response.data);
        } catch (error) {
            console.error('Error fetching friendly matches:', error);
        }
    };

    const fetchFriendlyChallenges = async () => {
        try {
            const response = await axiosInstance.get('matches/friendly-challenges/');
            setReceivedChallenges(response.data.received_challenges);
            setSentChallenges(response.data.sent_challenges);
        } catch (error) {
            console.error('Error fetching friendly challenges:', error);
        }
    };

    const searchTeams = async () => {
        try {
            const response = await axiosInstance.get(`league/search/?name=${searchQuery}`);
            setSearchResults(response.data);
        } catch (error) {
            console.error('Error searching teams:', error);
        }
    };

    const createFriendlyChallenge = async () => {
        if (!selectedTeam || !proposedDate) return;

        try {
            await axiosInstance.post('matches/friendly-challenges/create/', {
                challenged_team_id: selectedTeam.id,
                proposed_date: proposedDate,
            });
            fetchFriendlyChallenges();
            onNotificationUpdate();
            setSelectedTeam(null);
            setProposedDate('');
            setIsModalVisible(false);
        } catch (error) {
            console.error('Error creating friendly challenge:', error);
        }
    };

    const respondToChallenge = async (challengeId: number, response: 'accept' | 'decline') => {
        try {
            await axiosInstance.post(`matches/friendly-challenges/${challengeId}/respond/`, { response });
            fetchFriendlyChallenges();
            fetchFriendlyMatches();
            onNotificationUpdate();
        } catch (error) {
            console.error('Error responding to challenge:', error);
        }
    };

    const renderFriendlyMatchesTable = () => (
        <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Home Team</Text>
                <Text style={styles.tableHeaderCell}>Away Team</Text>
                <Text style={styles.tableHeaderCell}>Date</Text>
                <Text style={styles.tableHeaderCell}>Status</Text>
            </View>
            {friendlyMatches.length === 0 ? (
                <Text style={styles.noDataText}>No matches scheduled</Text>
            ) : (
                friendlyMatches.map((item) => (
                    <View key={item.id} style={styles.tableRow}>
                        <Text style={styles.tableCell}>{item.challenger}</Text>
                        <Text style={styles.tableCell}>{item.challenged}</Text>
                        <Text style={styles.tableCell}>{new Date(item.proposed_date).toLocaleDateString()}</Text>
                        <Text style={styles.tableCell}>{item.status}</Text>
                    </View>
                ))
            )}
        </View>
    );

    const renderFriendlyChallenge = (item: FriendlyChallenge) => (
        <View key={item.id} style={styles.challengeItem}>
            <View style={styles.challengeInfo}>
                <Text style={styles.challengeText}>{item.challenger || 'Your Team'} vs {item.challenged}</Text>
                <Text style={styles.challengeDate}>Date: {new Date(item.proposed_date).toLocaleDateString()}</Text>
                <Text style={styles.challengeStatus}>Status: {item.status}</Text>
            </View>
            {item.challenger && (
                <View style={styles.challengeActions}>
                    <TouchableOpacity
                        style={[styles.button, styles.acceptButton]}
                        onPress={() => respondToChallenge(item.id, 'accept')}
                    >
                        <Icon name="checkmark-circle" size={20} color="white" />
                        <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.declineButton]}
                        onPress={() => respondToChallenge(item.id, 'decline')}
                    >
                        <Icon name="close-circle" size={20} color="white" />
                        <Text style={styles.buttonText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    const renderHeader = () => (
        <>
            <Text style={styles.mainTitle}>Friendly Matches</Text>

            <TouchableOpacity style={styles.createChallengeButton} onPress={() => setIsModalVisible(true)}>
                <Icon name="add-circle" size={24} color="white" />
                <Text style={styles.createChallengeButtonText}>Create Challenge</Text>
            </TouchableOpacity>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Scheduled Matches</Text>
                {renderFriendlyMatchesTable()}
            </View>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Received Challenges</Text>
                {receivedChallenges.length === 0 ? (
                    <Text style={styles.noDataText}>No pending challenges</Text>
                ) : (
                    receivedChallenges.map(challenge => renderFriendlyChallenge(challenge))
                )}
            </View>

            {sentChallenges.length > 0 && (
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Sent Challenges</Text>
                    {sentChallenges.map(challenge => renderFriendlyChallenge(challenge))}
                </View>
            )}
        </>
    );

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={[{ key: 'dummy' }]} // We need at least one item for the list to render
                renderItem={() => null}
                ListHeaderComponent={renderHeader}
                contentContainerStyle={{ paddingBottom: 80 }} // Add padding to the bottom of the FlatList
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Challenge to Friendly</Text>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search teams..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <TouchableOpacity style={styles.searchButton} onPress={searchTeams}>
                            <Icon name="search" size={24} color="white" />
                            <Text style={styles.buttonText}>Search</Text>
                        </TouchableOpacity>
                        {searchResults.length > 0 && (
                            <FlatList
                                data={searchResults}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.teamItem}
                                        onPress={() => setSelectedTeam(item)}
                                    >
                                        <Text style={styles.teamName}>{item.name}</Text>
                                        <Text style={styles.teamInfo}>{item.country} - {item.division}</Text>
                                    </TouchableOpacity>
                                )}
                                keyExtractor={(item) => item.id.toString()}
                                style={styles.searchResults}
                            />
                        )}
                        {selectedTeam && (
                            <View style={styles.selectedTeam}>
                                <Text style={styles.selectedTeamText}>Selected: {selectedTeam.name}</Text>
                                <TextInput
                                    style={styles.dateInput}
                                    placeholder="Proposed Date (YYYY-MM-DD)"
                                    value={proposedDate}
                                    onChangeText={setProposedDate}
                                />
                                <TouchableOpacity style={styles.createButton} onPress={createFriendlyChallenge}>
                                    <Icon name="send" size={24} color="white" />
                                    <Text style={styles.buttonText}>Send Challenge</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                        <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                            <Icon name="close" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        margin: 20,
        textAlign: 'center',
        color: '#333',
    },
    section: {
        marginHorizontal: 20,
        marginBottom: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        overflow: 'hidden',
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        padding: 15,
        backgroundColor: '#f0f0f0',
        color: '#444',
    },
    tableContainer: {
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f0f0f0',
        padding: 10,
    },
    tableHeaderCell: {
        flex: 1,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#333',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        padding: 10,
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        color: '#444',
    },
    challengeItem: {
        padding: 15,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    challengeInfo: {
        flex: 1,
    },
    challengeText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    challengeDate: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    challengeStatus: {
        fontSize: 14,
        color: '#666',
        marginTop: 5,
    },
    challengeActions: {
        flexDirection: 'row',
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
        borderRadius: 5,
        marginLeft: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
        marginLeft: 5,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    declineButton: {
        backgroundColor: '#F44336',
    },
    noDataText: {
        textAlign: 'center',
        padding: 20,
        fontStyle: 'italic',
        color: '#666',
    },
    createChallengeButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 10,
        marginHorizontal: 20,
        marginBottom: 20,
    },
    createChallengeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        marginLeft: 10,
    },
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
        color: '#333',
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    searchButton: {
        backgroundColor: '#2196F3',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    searchResults: {
        maxHeight: 150,
        marginBottom: 10,
    },
    teamItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    teamName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    teamInfo: {
        fontSize: 14,
        color: '#666',
    },
    selectedTeam: {
        marginTop: 10,
        backgroundColor: '#e8f5e9',
        padding: 10,
        borderRadius: 5,
    },
    selectedTeamText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 10,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    createButton: {
        backgroundColor: '#4CAF50',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 5,
    },
    closeButton: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: '#F44336',
        borderRadius: 20,
        padding: 5,
    },
});

export default FriendliesComponent;