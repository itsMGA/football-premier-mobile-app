import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    SafeAreaView,
    Animated,
    Dimensions,
    Easing,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const { width } = Dimensions.get('window');

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const slideAnim = useRef(new Animated.Value(-100)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (activeTab) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -100,
                    duration: 300,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.cubic),
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [activeTab]);

    const renderSubMenu = () => {
        const subMenuItems = {
            'Club': ['Profile', 'Finances'],
            'Team': ['Players', 'Training', 'Game Plan', 'Employees'],
            'Transfers': ['Transfer Market', 'My Transfers', 'History'],
            'Matches': ['League', 'Match History', 'Friendlies'],
            'Finances': ['Sponsors', 'Loans', 'Statistics'],
            'Stadium': ['Upgrades', 'Maintenance', 'Events'],
        };

        return (
            <Animated.View
                style={[
                    styles.subMenuContainer,
                    {
                        transform: [{ translateY: slideAnim }],
                        opacity: fadeAnim,
                    },
                ]}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.subMenuContent}
                >
                    {subMenuItems[activeTab]?.map((item, index) => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.subMenuItem,
                                index === 0 && styles.subMenuItemFirst,
                                index === subMenuItems[activeTab].length - 1 && styles.subMenuItemLast,
                            ]}
                        >
                            <Text style={styles.subMenuText}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to Your Dashboard</Text>
                <Text style={styles.activeTabText}>Active Tab: {activeTab || 'None'}</Text>
            </View>
            {renderSubMenu()}
            <View style={styles.navbar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Club', 'Team', 'Transfers', 'Matches', 'Finances', 'Stadium'].map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[styles.navItem, activeTab === item && styles.activeNavItem]}
                            onPress={() => setActiveTab(activeTab === item ? null : item)}
                        >
                            <Icon name={getIconName(item)} size={24} color={activeTab === item ? '#4CAF50' : '#757575'} />
                            <Text style={[styles.navText, activeTab === item && styles.activeNavText]}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                <Icon name="exit-to-app" size={24} color="#fff" />
                <Text style={styles.logoutButtonText}>Logout</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const getIconName = (item: string): string => {
    switch (item) {
        case 'Club': return 'business';
        case 'Team': return 'people';
        case 'Transfers': return 'swap-horiz';
        case 'Matches': return 'sports-soccer';
        case 'Finances': return 'attach-money';
        case 'Stadium': return 'stadium';
        default: return 'circle';
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5FCFF',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    title: {
        fontSize: 24,
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    activeTabText: {
        fontSize: 18,
        marginBottom: 20,
        color: '#666',
    },
    navbar: {
        backgroundColor: '#FFFFFF',
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
    },
    navItem: {
        alignItems: 'center',
        paddingHorizontal: 15,
        width: width / 6, // Ensure equal width for all items
    },
    activeNavItem: {
        borderTopWidth: 2,
        borderTopColor: '#4CAF50',
    },
    navText: {
        color: '#757575',
        marginTop: 5,
        fontSize: 12,
    },
    activeNavText: {
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    subMenuContainer: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 70, // Adjust this value based on your navbar height
    },
    subMenuContent: {
        paddingHorizontal: 10,
    },
    subMenuItem: {
        backgroundColor: '#81C784',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginHorizontal: 5,
    },
    subMenuItemFirst: {
        marginLeft: 10,
    },
    subMenuItemLast: {
        marginRight: 10,
    },
    subMenuText: {
        color: '#FFF',
        fontWeight: 'bold',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4CAF50',
        padding: 10,
        borderRadius: 5,
        position: 'absolute',
        top: 20,
        right: 20,
    },
    logoutButtonText: {
        color: 'white',
        marginLeft: 10,
    },
});

export default Dashboard;