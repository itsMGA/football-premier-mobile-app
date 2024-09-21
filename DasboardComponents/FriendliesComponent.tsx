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

    const renderFriendlyMatchesTable = () => (
        <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
                <Text style={styles.tableHeaderCell}>Home Team</Text>
                <Text style={styles.tableHeaderCell}>Away Team</Text>
                <Text style={styles.tableHeaderCell}>Date</Text>
                <Text style={styles.tableHeaderCell}>Status</Text>
            </View>
            {friendlyMatches.length === 0 ? (
                <Text style={styles.noMatchesText}>No matches scheduled</Text>
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
            <Text style={styles.challengeText}>{item.challenger} vs {item.challenged}</Text>
            <Text style={styles.challengeText}>Date: {new Date(item.proposed_date).toLocaleDateString()}</Text>
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
        <ScrollView style={styles.container}>
            <Text style={styles.mainTitle}>Friendly Matches Hub</Text>

            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Friendly Matches</Text>
                {renderFriendlyMatchesTable()}
            </View>

            <View style={styles.divider} />

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
                                    <Text style={styles.teamName}>{team.name}</Text>
                                    <Text style={styles.teamInfo}>{team.country} - {team.division}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    )}
                    {selectedTeam && (
                        <View style={styles.selectedTeam}>
                            <Text style={styles.selectedTeamText}>Selected Team: {selectedTeam.name}</Text>
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

                <View style={styles.divider} />

                <View style={styles.challengesContainer}>
                    <Text style={styles.sectionTitle}>Friendly Challenges</Text>
                    {friendlyChallenges.length === 0 ? (
                        <Text style={styles.noChallengesText}>No pending challenges</Text>
                    ) : (
                        <FlatList
                            data={friendlyChallenges}
                            renderItem={renderFriendlyChallenge}
                            keyExtractor={(item) => item.id.toString()}
                            style={styles.challengeList}
                        />
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#F5F5F5',
    },
    mainTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#444',
    },
    tableContainer: {
        backgroundColor: 'white',
        borderRadius: 8,
        overflow: 'hidden',
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
    },
    noMatchesText: {
        textAlign: 'center',
        padding: 20,
        fontStyle: 'italic',
        color: '#666',
    },
    divider: {
        height: 1,
        backgroundColor: '#ccc',
        marginVertical: 20,
    },
    challengeSection: {
        flexDirection: 'column',
    },
    createChallengeContainer: {
        marginBottom: 20,
    },
    challengesContainer: {
        marginTop: 20,
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
        padding: 12,
        borderRadius: 5,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    searchResults: {
        maxHeight: 150,
        marginBottom: 10,
        backgroundColor: 'white',
        borderRadius: 5,
    },
    teamItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    teamName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    teamInfo: {
        fontSize: 14,
        color: '#666',
    },
    selectedTeam: {
        marginBottom: 10,
        backgroundColor: '#e8f5e9',
        padding: 10,
        borderRadius: 5,
    },
    selectedTeamText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    dateInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 5,
        padding: 10,
        marginVertical: 10,
    },
    challengeList: {
        maxHeight: 300,
    },
    challengeItem: {
        backgroundColor: 'white',
        padding: 15,
        borderRadius: 8,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    challengeText: {
        fontSize: 16,
        marginBottom: 5,
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
    noChallengesText: {
        textAlign: 'center',
        padding: 20,
        fontStyle: 'italic',
        color: '#666',
    },
});

export default FriendliesComponent;