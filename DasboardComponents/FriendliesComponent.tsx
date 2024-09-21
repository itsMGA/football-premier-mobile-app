import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    TextInput,
    FlatList,
} from 'react-native';
import axiosInstance from '../axiosConfig';

interface FriendliesComponentProps {
    onNotificationUpdate: () => void;
}

interface FriendlyChallenge {
    id: number;
    challenger: string;
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
    const [friendlyChallenges, setFriendlyChallenges] = useState<FriendlyChallenge[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [proposedDate, setProposedDate] = useState('');

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
            setFriendlyChallenges(response.data.received_challenges);
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

    const renderFriendlyMatch = ({ item }: { item: FriendlyChallenge }) => (
        <View style={styles.matchItem}>
            <Text>{item.challenger} vs {item.challenged}</Text>
            <Text>Date: {new Date(item.proposed_date).toLocaleDateString()}</Text>
            <Text>Status: {item.status}</Text>
        </View>
    );

    const renderFriendlyChallenge = ({ item }: { item: FriendlyChallenge }) => (
        <View style={styles.challengeItem}>
            <Text>{item.challenger} vs {item.challenged}</Text>
            <Text>Date: {new Date(item.proposed_date).toLocaleDateString()}</Text>
            <View style={styles.challengeActions}>
                <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={() => respondToChallenge(item.id, 'accept')}
                >
                    <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.declineButton]}
                    onPress={() => respondToChallenge(item.id, 'decline')}
                >
                    <Text style={styles.buttonText}>Decline</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Friendlies</Text>

            <View style={styles.matchesContainer}>
                <Text style={styles.sectionTitle}>Friendly Matches</Text>
                <FlatList
                    data={friendlyMatches}
                    renderItem={renderFriendlyMatch}
                    keyExtractor={(item) => item.id.toString()}
                    style={styles.matchList}
                />
            </View>

            <View style={styles.challengeSection}>
                <View style={styles.createChallengeContainer}>
                    <Text style={styles.sectionTitle}>Challenge to Friendly</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search teams..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    <TouchableOpacity style={styles.button} onPress={searchTeams}>
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
                                    <Text>{team.name}</Text>
                                    <Text>{team.country} - {team.division}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    {selectedTeam && (
                        <View style={styles.selectedTeam}>
                            <Text>Selected Team: {selectedTeam.name}</Text>
                            <TextInput
                                style={styles.dateInput}
                                placeholder="Proposed Date (YYYY-MM-DD)"
                                value={proposedDate}
                                onChangeText={setProposedDate}
                            />
                            <TouchableOpacity style={styles.button} onPress={createFriendlyChallenge}>
                                <Text style={styles.buttonText}>Create Friendly Challenge</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                <View style={styles.challengesContainer}>
                    <Text style={styles.sectionTitle}>Friendly Challenges</Text>
                    <FlatList
                        data={friendlyChallenges}
                        renderItem={renderFriendlyChallenge}
                        keyExtractor={(item) => item.id.toString()}
                        style={styles.challengeList}
                    />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    matchesContainer: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    matchList: {
        maxHeight: 200,
    },
    matchItem: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
        marginBottom: 10,
    },
    challengeSection: {
        flexDirection: 'row',
    },
    createChallengeContainer: {
        flex: 1,
        marginRight: 10,
    },
    challengesContainer: {
        flex: 1,
        marginLeft: 10,
    },
    searchInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginBottom: 10,
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    searchResults: {
        maxHeight: 150,
        marginBottom: 10,
    },
    teamItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    selectedTeam: {
        marginBottom: 10,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginVertical: 10,
    },
    challengeList: {
        maxHeight: 200,
    },
    challengeItem: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 5,
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
});

export default FriendliesComponent;