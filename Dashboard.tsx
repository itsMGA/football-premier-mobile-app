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
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import axiosInstance from './axiosConfig';
import FriendliesComponent from './DasboardComponents/FriendliesComponent';

const { width } = Dimensions.get('window');

interface DashboardProps {
    onLogout: () => void;
}

interface Notification {
    type: string;
    message: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<string | null>(null);
    const [activeSubMenu, setActiveSubMenu] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [displayContent, setDisplayContent] = useState<'welcome' | 'friendlies'>('welcome');
    const slideAnim = useRef(new Animated.Value(-50)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        fetchNotifications();
    }, []);

    useEffect(() => {
        if (activeTab) {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            Animated.parallel([
                Animated.timing(slideAnim, {
                    toValue: -50,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.timing(fadeAnim, {
                    toValue: 0,
                    duration: 200,
                    useNativeDriver: true,
                }),
            ]).start();
        }
    }, [activeTab]);

    const fetchNotifications = async () => {
        try {
            const response = await axiosInstance.get('league/team-notifications/');
            setNotifications(response.data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            setNotifications([]);
        }
    };

    const renderSubMenu = () => {
        const subMenuItems = {
            'Club': ['Profile', 'Finances', 'Sponsors', 'Loans', 'Statistics'],
            'Team': ['Players', 'Training', 'Game Plan', 'Employees'],
            'Transfers': ['Transfer Market', 'My Transfers', 'History'],
            'Matches': ['League', 'Match History', 'Friendlies'],
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
                            onPress={() => handleSubMenuPress(item)}
                        >
                            <Text style={styles.subMenuText}>{item}</Text>
                            {item === 'Friendlies' && notifications.filter(n => n.type === 'friendly_challenge').length > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationText}>
                                        {notifications.filter(n => n.type === 'friendly_challenge').length}
                                    </Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </Animated.View>
        );
    };

    const handleSubMenuPress = (item: string) => {
        setActiveSubMenu(item);
        if (item === 'Friendlies') {
            setDisplayContent('friendlies');
        } else {
            setDisplayContent('welcome');
        }
    };

    const navItems = ['Club', 'Team', 'Transfers', 'Matches', 'Stadium'];

    const renderContent = () => {
        switch (displayContent) {
            case 'friendlies':
                return (
                    <FriendliesComponent
                        onClose={() => setDisplayContent('welcome')}
                        onNotificationUpdate={fetchNotifications}
                    />
                );
            case 'welcome':
            default:
                return (
                    <View style={styles.content}>
                        <Text style={styles.title}>Welcome to Your Dashboard</Text>
                        <Text style={styles.activeTabText}>Active Tab: {activeTab || 'None'}</Text>
                        <Text style={styles.activeTabText}>Active Sub-Menu: {activeSubMenu || 'None'}</Text>
                    </View>
                );
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {renderContent()}
            {renderSubMenu()}
            <View style={styles.navbar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {navItems.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={styles.navItem}
                            onPress={() => {
                                setActiveTab(item);
                                setDisplayContent('welcome');
                            }}
                        >
                            <Icon
                                name={getIconName(item)}
                                size={24}
                                color={activeTab === item ? '#4CAF50' : '#757575'}
                            />
                            <Text style={[
                                styles.navText,
                                activeTab === item && styles.activeNavText
                            ]}>
                                {item}
                            </Text>
                            {item === 'Matches' && notifications.length > 0 && (
                                <View style={styles.notificationBadge}>
                                    <Text style={styles.notificationText}>{notifications.length}</Text>
                                </View>
                            )}
                            {activeTab === item && <View style={styles.activeItemUnderline} />}
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
        width: width / 5,
        position: 'relative',
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
    activeItemUnderline: {
        position: 'absolute',
        bottom: -10,
        left: '25%',
        right: '25%',
        height: 2,
        backgroundColor: '#4CAF50',
    },
    subMenuContainer: {
        backgroundColor: '#F0F0F0',
        paddingVertical: 10,
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 60,
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    subMenuContent: {
        paddingHorizontal: 10,
    },
    subMenuItem: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        marginHorizontal: 4,
        elevation: 2,
        marginBottom: 2,
    },
    subMenuItemFirst: {
        marginLeft: 10,
    },
    subMenuItemLast: {
        marginRight: 10,
    },
    subMenuText: {
        color: '#333',
        fontWeight: 'bold',
        fontSize: 12,
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
    notificationBadge: {
        position: 'absolute',
        right: -5,
        top: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    notificationText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
});

export default Dashboard;