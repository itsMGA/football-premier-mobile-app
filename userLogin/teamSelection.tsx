import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import axiosInstance from '../axiosConfig';

interface Country {
    id: number;
    name: string;
}

interface Division {
    id: number;
    name: string;
    level: number;
}

interface Team {
    id: number;
    name: string;
}

interface SelectClubPanelProps {
    onClose: () => void;
    onSelectTeam: (teamId: number) => void;
}

const SelectClubPanel: React.FC<SelectClubPanelProps> = ({ onClose, onSelectTeam }) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [selectedDivision, setSelectedDivision] = useState<Division | null>(null);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchCountries();
    }, []);

    const fetchCountries = async () => {
        try {
            setLoading(true);
            const response = await axiosInstance.get('/league/countries/');
            setCountries(response.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching countries:', error);
            setLoading(false);
        }
    };

    const fetchDivisions = async (countryId: number) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/league/available-divisions-by-country/?country_id=${countryId}`);
            setDivisions(response.data.available_divisions);
            setSelectedDivision(null);
            setTeams([]);
            setSelectedTeam(null);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching divisions:', error);
            setLoading(false);
        }
    };

    const fetchTeams = async (divisionId: number) => {
        try {
            setLoading(true);
            const response = await axiosInstance.get(`/league/available-teams-by-division/?division_id=${divisionId}`);
            setTeams(response.data.available_teams);
            setSelectedTeam(null);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching teams:', error);
            setLoading(false);
        }
    };

    const handleCountrySelect = (countryId: number) => {
        const country = countries.find(c => c.id === countryId);
        setSelectedCountry(country || null);
        if (country) {
            fetchDivisions(country.id);
        }
    };

    const handleDivisionSelect = (divisionId: number) => {
        const division = divisions.find(d => d.id === divisionId);
        setSelectedDivision(division || null);
        if (division) {
            fetchTeams(division.id);
        }
    };

    const handleTeamSelect = (teamId: number) => {
        const team = teams.find(t => t.id === teamId);
        setSelectedTeam(team || null);
    };

    const handleSelectTeam = async () => {
        if (selectedTeam) {
            try {
                setLoading(true);
                await axiosInstance.post('/accounts/user-progress/assign-team/', { team_id: selectedTeam.id });
                onSelectTeam(selectedTeam.id);
                setLoading(false);
            } catch (error) {
                console.error('Error assigning team:', error);
                setLoading(false);
            }
        }
    };

    return (
        <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select a Club</Text>

            {loading && <ActivityIndicator size="large" color="#ffffff" />}

            <Picker
                selectedValue={selectedCountry?.id}
                style={styles.picker}
                onValueChange={(itemValue) => handleCountrySelect(Number(itemValue))}
            >
                <Picker.Item label="Select a country" value="" />
                {countries.map((country) => (
                    <Picker.Item key={country.id} label={country.name} value={country.id} />
                ))}
            </Picker>

            {selectedCountry && (
                <Picker
                    selectedValue={selectedDivision?.id}
                    style={styles.picker}
                    onValueChange={(itemValue) => handleDivisionSelect(Number(itemValue))}
                >
                    <Picker.Item label="Select a division" value="" />
                    {divisions.map((division) => (
                        <Picker.Item key={division.id} label={division.name} value={division.id} />
                    ))}
                </Picker>
            )}

            {selectedDivision && (
                <Picker
                    selectedValue={selectedTeam?.id}
                    style={styles.picker}
                    onValueChange={(itemValue) => handleTeamSelect(Number(itemValue))}
                >
                    <Picker.Item label="Select a team" value="" />
                    {teams.map((team) => (
                        <Picker.Item key={team.id} label={team.name} value={team.id} />
                    ))}
                </Picker>
            )}

            <TouchableOpacity
                style={[styles.button, !selectedTeam && styles.disabledButton]}
                onPress={handleSelectTeam}
                disabled={!selectedTeam || loading}
            >
                <Text style={styles.buttonText}>Select Team</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 100, 0, 0.9)',
        padding: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#ffffff',
        marginBottom: 20,
    },
    picker: {
        width: '100%',
        backgroundColor: 'white',
        marginBottom: 20,
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 25,
        width: '100%',
        marginTop: 20,
    },
    disabledButton: {
        backgroundColor: '#A9A9A9',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 16,
    },
    closeButton: {
        marginTop: 20,
        padding: 10,
    },
    closeButtonText: {
        color: 'white',
        fontSize: 16,
    },
});

export default SelectClubPanel;