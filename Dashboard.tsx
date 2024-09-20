import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface DashboardProps {
    onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onLogout }) => {
    const [activeTab, setActiveTab] = useState<string | null>(null);

    const renderSubMenu = () => {
        switch (activeTab) {
            case 'Club':
                return ['Profile', 'Finances'].map(item => (
                    <TouchableOpacity key={item} style={styles.subMenuItem}>
                        <Text style={styles.subMenuText}>{item}</Text>
                    </TouchableOpacity>
                ));
            case 'Team':
                return ['Players', 'Training', 'Game Plan', 'Employees'].map(item => (
                    <TouchableOpacity key={item} style={styles.subMenuItem}>
                        <Text style={styles.subMenuText}>{item}</Text>
                    </TouchableOpacity>
                ));
            case 'Transfers':
                return ['Transfer Market', 'My Transfers', 'History'].map(item => (
                    <TouchableOpacity key={item} style={styles.subMenuItem}>
                        <Text style={styles.subMenuText}>{item}</Text>
                    </TouchableOpacity>
                ));
            case 'Matches':
                return ['League', 'Match History', 'Friendlies'].map(item => (
                    <TouchableOpacity key={item} style={styles.subMenuItem}>
                        <Text style={styles.subMenuText}>{item}</Text>
                    </TouchableOpacity>
                ));
            case 'Finances':
                return ['Sponsors', 'Loans', 'Statistics'].map(item => (
                    <TouchableOpacity key={item} style={styles.subMenuItem}>
                        <Text style={styles.subMenuText}>{item}</Text>
                    </TouchableOpacity>
                ));
            default:
                return null;
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Welcome to Your Dashboard</Text>
                <Text style={styles.activeTabText}>Active Tab: {activeTab || 'None'}</Text>
            </View>
            {activeTab && (
                <ScrollView horizontal style={styles.subMenu} showsHorizontalScrollIndicator={false}>
                    {renderSubMenu()}
                </ScrollView>
            )}
            <View style={styles.navbar}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['Club', 'Team', 'Transfers', 'Matches', 'Finances', 'Stadium'].map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[styles.navItem, activeTab === item && styles.activeNavItem]}
                            onPress={() => setActiveTab(activeTab === item ? null : item)}
                        >
                            <Icon name={getIconName(item)} size={24} color="#fff" />
                            <Text style={styles.navText}>{item}</Text>
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
    },
    activeTabText: {
        fontSize: 18,
        marginBottom: 20,
    },
    navbar: {
        backgroundColor: '#4CAF50',
        paddingVertical: 10,
    },
    navItem: {
        alignItems: 'center',
        paddingHorizontal: 15,
    },
    activeNavItem: {
        borderTopWidth: 2,
        borderTopColor: '#FFF',
    },
    navText: {
        color: '#FFF',
        marginTop: 5,
    },
    subMenu: {
        backgroundColor: '#81C784',
        paddingVertical: 10,
    },
    subMenuItem: {
        paddingHorizontal: 15,
        paddingVertical: 5,
    },
    subMenuText: {
        color: '#FFF',
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