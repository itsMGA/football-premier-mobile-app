import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
    ImageBackground,
    Animated,
    Dimensions,
    PanResponder,
    ScrollView,
    Modal,
} from 'react-native';
import axiosInstance from '../axiosConfig';
import Icon from 'react-native-vector-icons/MaterialIcons';

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

const { width, height } = Dimensions.get('window');

const SelectClubPanel: React.FC<SelectClubPanelProps> = ({ onClose, onSelectTeam }) => {
    const [countries, setCountries] = useState<Country[]>([]);
    const [selectedCountryIndex, setSelectedCountryIndex] = useState<number>(0);
    const [divisions, setDivisions] = useState<Division[]>([]);
    const [selectedDivisionIndex, setSelectedDivisionIndex] = useState<number>(0);
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamIndex, setSelectedTeamIndex] = useState<number>(0);
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState<'country' | 'division' | 'team'>('country');
    const [showModal, setShowModal] = useState(false);

    const [isAssigning, setIsAssigning] = useState(false);
    const lastAssignTime = useRef(0);

    const panY = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(height)).current;

    const MAX_SCROLL = 1250; // Maximum scroll distance for the elastic effect

    const panResponder = PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
            return Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
        },
        onPanResponderMove: (_, gestureState) => {
            const newY = gestureState.dy;
            if (newY > 0) {
                panY.setValue(Math.min(MAX_SCROLL, newY - (newY * newY) / (4 * MAX_SCROLL)));
            } else {
                panY.setValue(Math.max(-MAX_SCROLL, newY + (newY * newY) / (4 * MAX_SCROLL)));
            }
        },
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dy > 5) {
                navigateSelection('prev');
            } else if (gestureState.dy < -5) {
                navigateSelection('next');
            }
            Animated.spring(panY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
        },
    });

    useEffect(() => {
        fetchCountries();
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(slideAnim, {
                toValue: 0,
                tension: 20,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
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
            setSelectedDivisionIndex(0);
            setTeams([]);
            setSelectedTeamIndex(0);
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
            setSelectedTeamIndex(0);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching teams:', error);
            setLoading(false);
        }
    };

    const navigateSelection = (direction: 'next' | 'prev') => {
        let currentItems: any[];
        let setIndex: (index: number) => void;
        let selectedIndex: number;

        switch (step) {
            case 'country':
                currentItems = countries;
                setIndex = setSelectedCountryIndex;
                selectedIndex = selectedCountryIndex;
                break;
            case 'division':
                currentItems = divisions;
                setIndex = setSelectedDivisionIndex;
                selectedIndex = selectedDivisionIndex;
                break;
            case 'team':
                currentItems = teams;
                setIndex = setSelectedTeamIndex;
                selectedIndex = selectedTeamIndex;
                break;
        }

        if (direction === 'next') {
            setIndex((selectedIndex + 1) % currentItems.length);
        } else {
            setIndex((selectedIndex - 1 + currentItems.length) % currentItems.length);
        }
    };

    const handleNext = () => {
        if (step === 'country' && countries.length > 0) {
            fetchDivisions(countries[selectedCountryIndex].id);
            setStep('division');
        } else if (step === 'division' && divisions.length > 0) {
            fetchTeams(divisions[selectedDivisionIndex].id);
            setStep('team');
        } else if (step === 'team' && teams.length > 0) {
            handleSelectTeam();
        }
    };

    const handlePrevious = () => {
        if (step === 'division') {
            setStep('country');
        } else if (step === 'team') {
            setStep('division');
        }
    };
    const handleSelectTeam = useCallback(async () => {
        const now = Date.now();
        if (isAssigning || now - lastAssignTime.current < 1000) {
            console.log('Preventing duplicate assignment');
            return;
        }

        if (teams.length > 0) {
            try {
                setIsAssigning(true);
                lastAssignTime.current = now;
                console.log('Assigning team:', teams[selectedTeamIndex].id);
                setLoading(true);
                await axiosInstance.post('/accounts/user-progress/assign-team/', { team_id: teams[selectedTeamIndex].id });
                setLoading(false);
                console.log('Team assigned successfully');
                onSelectTeam(teams[selectedTeamIndex].id.toString()); // Call this after successful assignment
            } catch (error) {
                console.error('Error assigning team:', error);
                setLoading(false);
            } finally {
                setIsAssigning(false);
            }
        }
    }, [teams, selectedTeamIndex, onSelectTeam]);




    const renderSelector = () => {
        let items: { id: number; name: string }[] = [];
        let selectedIndex = 0;

        switch (step) {
            case 'country':
                items = countries;
                selectedIndex = selectedCountryIndex;
                break;
            case 'division':
                items = divisions;
                selectedIndex = selectedDivisionIndex;
                break;
            case 'team':
                items = teams;
                selectedIndex = selectedTeamIndex;
                break;
        }

        return (
            <Animated.View
                style={[
                    styles.selectorContainer,
                    {
                        transform: [
                            {
                                translateY: panY.interpolate({
                                    inputRange: [-MAX_SCROLL, 0, MAX_SCROLL],
                                    outputRange: [-10, 0, 10],
                                    extrapolate: 'clamp',
                                }),
                            },
                        ],
                    },
                ]}
                {...panResponder.panHandlers}
            >
                <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={() => navigateSelection('prev')}
                >
                    <Icon name="keyboard-arrow-up" size={30} color="#FFFFFF" />
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.selectedItem}
                    onPress={() => setShowModal(true)}
                >
                    <Text style={styles.selectedItemText}>{items[selectedIndex]?.name || 'Loading...'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.arrowButton}
                    onPress={() => navigateSelection('next')}
                >
                    <Icon name="keyboard-arrow-down" size={30} color="#FFFFFF" />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    const renderModal = () => {
        let items: { id: number; name: string }[] = [];
        let selectedIndex = 0;
        let title = '';

        switch (step) {
            case 'country':
                items = countries;
                selectedIndex = selectedCountryIndex;
                title = 'Select a Country';
                break;
            case 'division':
                items = divisions;
                selectedIndex = selectedDivisionIndex;
                title = 'Select a Division';
                break;
            case 'team':
                items = teams;
                selectedIndex = selectedTeamIndex;
                title = 'Select a Team';
                break;
        }

        return (
            <Modal
                animationType="fade"
                transparent={true}
                visible={showModal}
                onRequestClose={() => setShowModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <ScrollView style={styles.itemList}>
                            {items.map((item, index) => (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[
                                        styles.itemListItem,
                                        index === selectedIndex && styles.selectedListItem
                                    ]}
                                    onPress={() => {
                                        switch (step) {
                                            case 'country':
                                                setSelectedCountryIndex(index);
                                                break;
                                            case 'division':
                                                setSelectedDivisionIndex(index);
                                                break;
                                            case 'team':
                                                setSelectedTeamIndex(index);
                                                break;
                                        }
                                        setShowModal(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.itemListText,
                                        index === selectedIndex && styles.selectedListText
                                    ]}>{item.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                        <TouchableOpacity
                            style={styles.closeModalButton}
                            onPress={() => setShowModal(false)}
                        >
                            <Text style={styles.closeModalButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        );
    };

    return (
        <ImageBackground
            source={require('../images/field.jpg')}
            style={styles.backgroundImage}
        >
            <View style={styles.overlay}>
                <Animated.View style={[
                    styles.modalContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                    }
                ]}>
                    <Text style={styles.modalTitle}>
                        {step === 'country' ? 'Select Your Country' :
                            step === 'division' ? 'Select Your Division' :
                                'Select Your Team'}
                    </Text>

                    <View style={styles.loadingContainer}>
                        {loading && (
                            <ActivityIndicator
                                size="large"
                                color="#ffffff"
                                style={{ position: 'absolute' }}
                            />
                        )}
                    </View>

                    {renderSelector()}

                    <TouchableOpacity
                        style={[styles.button, (step === 'team' && !teams[selectedTeamIndex]) && styles.disabledButton]}
                        onPress={handleNext}
                        disabled={loading || (step === 'team' && !teams[selectedTeamIndex])}
                    >
                        <Text style={styles.buttonText}>
                            {step === 'team' ? 'Confirm Selection' : 'Next'}
                        </Text>
                    </TouchableOpacity>

                    {step !== 'country' && (
                        <TouchableOpacity style={styles.backButton} onPress={handlePrevious}>
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>Back to Login</Text>
                    </TouchableOpacity>
                </Animated.View>
            </View>
            {renderModal()}
        </ImageBackground>
    );
};

const styles = StyleSheet.create({
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 50, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContainer: {
        width: '90%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 20,
        textAlign: 'center',
    },
    selectorContainer: {
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    arrowButton: {
        padding: 10,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        borderRadius: 25,
        marginVertical: 5,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrowText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    selectedItem: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 10,
        padding: 15,
        marginVertical: 10,
        width: '100%',
        alignItems: 'center',
    },
    selectedItemText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
    },
    button: {
        backgroundColor: '#4CAF50',
        padding: 15,
        borderRadius: 25,
        width: '100%',
        marginTop: 20,
    },
    disabledButton: {
        backgroundColor: 'rgba(169, 169, 169, 0.5)',
    },
    buttonText: {
        color: 'white',
        textAlign: 'center',
        fontWeight: 'bold',
        fontSize: 18,
    },
    backButton: {
        marginTop: 15,
        padding: 10,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    closeButton: {
        marginTop: 15,
        padding: 10,
    },
    closeButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        width: '80%',
        maxHeight: '80%',
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
    },
    itemList: {
        width: '100%',
        marginBottom: 20,
    },
    itemListItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    selectedListItem: {
        backgroundColor: 'rgba(76, 175, 80, 0.2)',
    },
    itemListText: {
        fontSize: 18,
        color: '#006400',
    },
    selectedListText: {
        fontWeight: 'bold',
        color: '#4CAF50',
    },
    closeModalButton: {
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 15,
    },
    closeModalButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loadingContainer: {
        height: 50,  // Adjust this value as needed
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
});

export default SelectClubPanel;