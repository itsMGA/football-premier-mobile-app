import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
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
                <FlatList
                    data={friendlyMatches}
                    renderItem={({ item }) => (
                        <View style={styles.tableRow}>
                            <Text style={styles.tableCell}>{item.challenger}</Text>
                            <Text style={styles.tableCell}>{item.challenged}</Text>
                            <Text style={styles.tableCell}>{new Date(item.proposed_date).toLocaleDateString()}</Text>
                            <Text style={styles.tableCell}>{item.status}</Text>
                        </View>
                    )}
                    keyExtractor={(item) => item.id.toString()}
                />
            )}
        </View>
    );

    const renderFriendlyChallenge = ({ item }: { item: FriendlyChallenge }) => (
        <View style={styles.challengeItem}>
            <View style={styles.challengeInfo}>
                <Text style={styles.challengeText}>{item.challenger || 'Your Team'} vs {item.challenged}</Text>
                <Text style={styles.challengeDate}>Date: {new Date(item.proposed_date).toLocaleDateString()}</Text>
                <Text style={styles.challengeStatus}>Status: {item.status}</Text>
            </View>
            {item.challenger && ( // Only show action buttons for received challenges
                <View style={styles.challengeActions}>
                    <TouchableOpacity
                        style={[styles.button, styles.acceptButton]}
                        onPress={() => respondToChallenge(item.id, 'accept')}
                    >
                        <Icon name="checkmark-circle" size={24} color="white" />
                        <Text style={styles.buttonText}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.button, styles.declineButton]}
                        onPress={() => respondToChallenge(item.id, 'decline')}
                    >
                        <Icon name="close-circle" size={24} color="white" />
                        <Text style={styles.buttonText}>Decline</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Text style={styles.mainTitle}>Friendly Matches</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Scheduled Matches</Text>
                    {renderFriendlyMatchesTable()}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Received Challenges</Text>
                    {receivedChallenges.length === 0 ? (
                        <Text style={styles.noDataText}>No pending challenges</Text>
                    ) : (
                        <FlatList
                            data={receivedChallenges}
                            renderItem={renderFriendlyChallenge}
                            keyExtractor={(item) => item.id.toString()}
                            style={styles.challengeList}
                        />
                    )}
                </View>

                {sentChallenges.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sent Challenges</Text>
                        <FlatList
                            data={sentChallenges}
                            renderItem={renderFriendlyChallenge}
                            keyExtractor={(item) => item.id.toString()}
                            style={styles.challengeList}
                        />
                    </View>
                )}

                <TouchableOpacity style={styles.createChallengeButton} onPress={() => setIsModalVisible(true)}>
                    <Icon name="add-circle" size={24} color="white" />
                    <Text style={styles.createChallengeButtonText}>Create Challenge</Text>
                </TouchableOpacity>

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
                                <ScrollView style={styles.searchResults}>
                                    {searchResults.map((team) => (
                                        <TouchableOpacity
                                            key={team.id}
                                            style={styles.teamItem}
                                            onPress={() => setSelectedTeam(team)}
                                        >
                                            <Text style={styles.teamName}>{team.name}</Text>
                                            <Text style={styles.teamInfo}>{team.country} - {team.division}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
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
            </ScrollView>
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
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
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
    noDataText: {
        textAlign: 'center',
        padding: 20,
        fontStyle: 'italic',
        color: '#666',
    },
    challengeList: {
        maxHeight: 300,
    },
    challengeItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
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
        padding: 10,
        borderRadius: 5,
        marginLeft: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    acceptButton: {
        backgroundColor: '#4CAF50',
    },
    declineButton: {
        backgroundColor: '#F44336',
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