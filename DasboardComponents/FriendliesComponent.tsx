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
    Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import axiosInstance from '../axiosConfig';
import { format, parseISO } from 'date-fns';

interface FriendliesComponentProps {
    onNotificationUpdate: () => void;
    userTeamId: number;
}

interface FriendlyChallenge {
    id: number;
    challenger?: string;
    challenged: string;
    status: string;
}

interface Team {
    id: number;
    name: string;
    division: string;
    country: string;
}

interface MatchData {
    id: number;
    home_team: string;
    away_team: string;
    date: string;
    home_score: number | null;
    away_score: number | null;
    status: 'NOT_STARTED' | 'SIMULATED';
}

const FriendliesComponent: React.FC<FriendliesComponentProps> = ({ onNotificationUpdate, userTeamId }) => {
    const [friendlyMatches, setFriendlyMatches] = useState<MatchData[]>([]);
    const [receivedChallenges, setReceivedChallenges] = useState<FriendlyChallenge[]>([]);
    const [sentChallenges, setSentChallenges] = useState<FriendlyChallenge[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [userTeam, setUserTeam] = useState(null);

    const pendingSentChallenges = sentChallenges.filter(challenge => challenge.status === "PENDING");

    useEffect(() => {
        fetchFriendlyMatches();
        fetchFriendlyChallenges();
        fetchUserTeam();
    }, []);

    const fetchFriendlyMatches = async () => {
        try {
            const response = await axiosInstance.get('matches/all/');
            if (response.data && Array.isArray(response.data.matches)) {
                setFriendlyMatches(response.data.matches);
            } else {
                console.error('Unexpected response format:', response.data);
                setFriendlyMatches([]);
            }
        } catch (error) {
            console.error('Error fetching friendly matches:', error);
            setFriendlyMatches([]);
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

    const fetchUserTeam = async () => {
        try {
            const response = await axiosInstance.get('accounts/user-team/');
            setUserTeam(response.data);
        } catch (error) {
            console.error('Error fetching user team:', error);
        }
    };

    const openModal = () => {
        setIsModalVisible(true);
        setErrorMessage(null);
        setSelectedTeam(null);
        setSearchQuery('');
        setSearchResults([]);
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
        if (!selectedTeam) return;

        try {
            await axiosInstance.post('matches/friendly-challenges/create/', {
                challenged_team_id: selectedTeam.id,
            });
            fetchFriendlyChallenges();
            onNotificationUpdate();
            setSelectedTeam(null);
            setIsModalVisible(false);
            setErrorMessage(null);
        } catch (error) {
            console.error('Error creating friendly challenge:', error);
            if (error.response && error.response.data && error.response.data.error) {
                setErrorMessage(error.response.data.error);
            } else {
                setErrorMessage('An error occurred while creating the challenge.');
            }
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
                <Text style={styles.tableHeaderCell}>Score</Text>
                <Text style={styles.tableHeaderCell}>Status</Text>
                <Text style={styles.tableHeaderCell}>Result</Text>
            </View>
            {friendlyMatches.length === 0 ? (
                <Text style={styles.noDataText}>No matches available</Text>
            ) : (
                <FlatList
                    data={friendlyMatches}
                    renderItem={({ item }) => {
                        const kickoffTime = parseISO(item.date);
                        const formattedKickoff = format(kickoffTime, 'yyyy-MM-dd HH:mm');
                        const score = item.status === 'SIMULATED' ? `${item.home_score} - ${item.away_score}` : '-';

                        return (
                            <View style={styles.tableRow}>
                                <Text style={styles.tableCell}>{item.home_team}</Text>
                                <Text style={styles.tableCell}>{item.away_team}</Text>
                                <Text style={styles.tableCell}>{formattedKickoff}</Text>
                                <Text style={styles.tableCell}>{score}</Text>
                                <Text style={styles.tableCell}>{item.status}</Text>
                                <View style={styles.tableCell}>
                                    {item.status === 'SIMULATED' ? (
                                        <TouchableOpacity
                                            style={styles.resultButton}
                                            onPress={() => getMatchResult(item.id)}
                                        >
                                            <Text style={styles.resultButtonText}>View Result</Text>
                                        </TouchableOpacity>
                                    ) : (
                                        <Text>-</Text>
                                    )}
                                </View>
                            </View>
                        );
                    }}
                    keyExtractor={(item) => item.id.toString()}
                />
            )}
        </View>
    );

    const getMatchResult = async (matchId: number) => {
        try {
            const response = await axiosInstance.get(`matches/match-result/${matchId}/`);
            Alert.alert(
                'Match Result',
                `Home Score: ${response.data.home_score}\nAway Score: ${response.data.away_score}`,
                [{ text: 'OK' }]
            );
        } catch (error) {
            console.error('Error fetching match result:', error);
            Alert.alert('Error', 'Unable to fetch match result. Please try again later.');
        }
    };

    const renderFriendlyChallenge = (item: FriendlyChallenge, isReceived: boolean) => (
        <View key={item.id} style={styles.challengeItem}>
            <View style={styles.challengeInfo}>
                <Text style={styles.challengeText}>{item.challenger || 'Your Team'} vs {item.challenged}</Text>
                <Text style={styles.challengeStatus}>Status: {item.status}</Text>
            </View>
            {isReceived && item.status === "PENDING" && (
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

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={[{ key: 'dummy' }]}
                renderItem={() => null}
                ListHeaderComponent={() => (
                    <>
                        <Text style={styles.mainTitle}>Friendly Matches</Text>

                        <TouchableOpacity style={styles.createChallengeButton} onPress={openModal}>
                            <Icon name="add-circle" size={24} color="white" />
                            <Text style={styles.createChallengeButtonText}>Create Challenge</Text>
                        </TouchableOpacity>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>All Matches</Text>
                            {renderFriendlyMatchesTable()}
                        </View>

                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Received Challenges</Text>
                            {receivedChallenges.length === 0 ? (
                                <Text style={styles.noDataText}>No pending challenges</Text>
                            ) : (
                                receivedChallenges.map(challenge => renderFriendlyChallenge(challenge, true))
                            )}
                        </View>

                        {pendingSentChallenges.length > 0 && (
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Sent Challenges</Text>
                                {pendingSentChallenges.map(challenge => (
                                    <View key={challenge.id} style={styles.challengeItem}>
                                        <View style={styles.challengeInfo}>
                                            <Text style={styles.challengeText}>{challenge.challenger} vs {challenge.challenged}</Text>
                                            <Text style={styles.challengeStatus}>Status: {challenge.status}</Text>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        )}
                    </>
                )}
                contentContainerStyle={{ paddingBottom: 80 }}
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

                        {errorMessage && (
                            <Text style={styles.errorMessage}>{errorMessage}</Text>
                        )}

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
                                <TouchableOpacity style={styles.createButton} onPress={createFriendlyChallenge}>
                                    <Icon name="send" size={24} color="white" />
                                    <Text style={styles.buttonText}>Send Challenge</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => {
                                setIsModalVisible(false);
                                setErrorMessage(null);
                                setSelectedTeam(null);
                                setSearchQuery('');
                                setSearchResults([]);
                            }}
                        >
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
    errorMessage: {
        color: 'red',
        textAlign: 'center',
        marginBottom: 10,
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
        marginHorizontal: 10,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#2196F3',
        padding: 12,
    },
    tableHeaderCell: {
        flex: 1,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        fontSize: 14,
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
        padding: 12,
        backgroundColor: 'white',
    },
    tableCell: {
        flex: 1,
        textAlign: 'center',
        color: '#333',
        fontSize: 12,
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
    resultButton: {
        backgroundColor: '#4CAF50',
        padding: 6,
        borderRadius: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        backgroundColor: '#B0BEC5',
    },
    resultButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 12,
    },
});

export default FriendliesComponent;