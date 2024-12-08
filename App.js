import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TextInput, TouchableOpacity, FlatList, Switch, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as SplashScreen from 'expo-splash-screen';
import { searchLyrics, searchYouTube, findRelevantLyricSnippet } from './utils/api';
import LyricResult from './components/LyricResult';
import YouTubeResult from './components/YouTubeResult';
import ClipPreview from './components/ClipPreview';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [youtubeResults, setYoutubeResults] = useState([]);
  const [selectedLyric, setSelectedLyric] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Simulate some resource loading
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn(e);
      } finally {
        setIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (isReady) {
      await SplashScreen.hideAsync();
    }
  }, [isReady]);

  if (!isReady) {
    return null;
  }

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const lyricsResults = await searchLyrics(searchQuery);
      setResults(lyricsResults);

      if (lyricsResults.length > 0) {
        const firstResult = lyricsResults[0].track;
        const youtubeQuery = `${firstResult.track_name} ${firstResult.artist_name}`;
        const youtubeResults = await searchYouTube(youtubeQuery);
        setYoutubeResults(youtubeResults);
      }
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectLyric = (track, youtubeVideo) => {
    setSelectedLyric({
      lyric: findRelevantLyricSnippet(track.track.lyrics, searchQuery),
      songTitle: track.track.track_name,
      artist: track.track.artist_name,
      videoId: youtubeVideo.id.videoId,
      fullLyrics: track.track.lyrics,
    });
  };

  return (
    <SafeAreaView style={[styles.container, darkMode && styles.darkContainer]} onLayout={onLayoutRootView}>
      <StatusBar style={darkMode ? 'light' : 'dark'} />
      <View style={styles.header}>
        <Text style={[styles.title, darkMode && styles.darkText]}>Lyric-to-Clip</Text>
        <View style={styles.darkModeContainer}>
          <Text style={[styles.darkModeText, darkMode && styles.darkText]}>Dark Mode</Text>
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
      </View>

      {!selectedLyric ? (
        <View style={styles.content}>
          <View style={styles.searchContainer}>
            <TextInput
              style={[styles.input, darkMode && styles.darkInput]}
              placeholder="Type your message..."
              placeholderTextColor={darkMode ? '#999' : '#666'}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Ionicons name="search" size={24} color="white" />
              )}
            </TouchableOpacity>
          </View>

          <FlatList
            data={results}
            keyExtractor={(item, index) => `lyric-${index}`}
            renderItem={({ item, index }) => (
              <LyricResult
                track={item}
                onSelect={() => handleSelectLyric(item, youtubeResults[index])}
                darkMode={darkMode}
                searchQuery={searchQuery}
              />
            )}
            ListHeaderComponent={() => results.length > 0 && (
              <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>Lyrics Results</Text>
            )}
          />

          <FlatList
            data={youtubeResults}
            keyExtractor={(item) => `youtube-${item.id.videoId}`}
            renderItem={({ item }) => (
              <YouTubeResult
                result={item}
                darkMode={darkMode}
              />
            )}
            ListHeaderComponent={() => youtubeResults.length > 0 && (
              <Text style={[styles.sectionTitle, darkMode && styles.darkText]}>YouTube Results</Text>
            )}
          />
        </View>
      ) : (
        <ClipPreview
          lyric={selectedLyric.lyric}
          songTitle={selectedLyric.songTitle}
          artist={selectedLyric.artist}
          videoId={selectedLyric.videoId}
          fullLyrics={selectedLyric.fullLyrics}
          darkMode={darkMode}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  darkContainer: {
    backgroundColor: '#1a1a1a',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  darkText: {
    color: '#fff',
  },
  darkModeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  darkModeText: {
    marginRight: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 8,
    marginRight: 8,
  },
  darkInput: {
    borderColor: '#444',
    color: '#fff',
    backgroundColor: '#333',
  },
  searchButton: {
    backgroundColor: '#6200ee',
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
});

