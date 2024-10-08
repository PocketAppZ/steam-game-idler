import React, { useEffect, useState, useRef } from 'react';
import PageHeader from './PageHeader';
import GameIdleList from './GameIdleList';
import GameAchievementList from './GameAchievementList';
import Private from './Private';
import Loader from '../Loader';

export default function GamesList({ steamId, inputValue, isQuery, activePage, setActivePage, setAppId, showAchievements, setShowAchievements }) {
    const scrollContainerRef = useRef(null);
    let [isLoading, setIsLoading] = useState(true);
    let [gameList, setGameList] = useState(null);
    const [sortStyle, setSortStyle] = useState('a-z');
    const [favorites, setFavorites] = useState(null);
    const [cardFarming, setCardFarming] = useState(null);
    const [achievementUnlocker, setAchievementUnlocker] = useState(null);
    const [showStats, setShowStats] = useState(false);
    const [filteredGames, setFilteredGames] = useState([]);
    const [visibleGames, setVisibleGames] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const gamesPerPage = 50;

    useEffect(() => {
        setIsLoading(true);
        const showStats = localStorage.getItem('showStats');
        setShowStats(JSON.parse(showStats));
        const sortStyle = localStorage.getItem('sortStyle');
        if (sortStyle) setSortStyle(sortStyle);
        const cachedGameList = sessionStorage.getItem('gamesListCache');
        if (cachedGameList && cachedGameList !== null) {
            const parsedGameList = JSON.parse(cachedGameList);
            setGameList(parsedGameList);
            setVisibleGames(parsedGameList.slice(0, gamesPerPage));
            setTimeout(() => {
                setIsLoading(false);
            }, 100);
        } else {
            fetch('https://apibase.vercel.app/api/route', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ route: 'user-games-list', steamId: steamId }),
            }).then(async (res) => {
                if (res.status !== 500) {
                    const gameList = await res.json();
                    setGameList(gameList);
                    setVisibleGames(gameList.slice(0, gamesPerPage));
                    sessionStorage.setItem('gamesListCache', JSON.stringify(gameList));
                }
                setIsLoading(false);
            });
        }
    }, [steamId]);

    useEffect(() => {
        if (gameList) {
            let sortedAndFilteredGames = [...gameList];
            if (sortStyle === 'a-z') {
                sortedAndFilteredGames.sort((a, b) => a.game.name.localeCompare(b.game.name));
            } else if (sortStyle === 'z-a') {
                sortedAndFilteredGames.sort((a, b) => b.game.name.localeCompare(a.game.name));
            } else if (sortStyle === '1-0') {
                sortedAndFilteredGames.sort((a, b) => b.minutes - a.minutes);
            } else if (sortStyle === '0-1') {
                sortedAndFilteredGames.sort((a, b) => a.minutes - b.minutes);
            } else if (sortStyle === 'recent') {
                sortedAndFilteredGames.sort((a, b) => b.lastPlayedTimestamp - a.lastPlayedTimestamp);
            } else if (sortStyle === 'favorite') {
                const favorites = (localStorage.getItem('favorites') && JSON.parse(localStorage.getItem('favorites'))) || [];
                sortedAndFilteredGames = favorites.map(JSON.parse);
            } else if (sortStyle === 'cardFarming') {
                const cardFarming = (localStorage.getItem('cardFarming') && JSON.parse(localStorage.getItem('cardFarming'))) || [];
                sortedAndFilteredGames = cardFarming.map(JSON.parse);
            } else if (sortStyle === 'achievementUnlocker') {
                const achievementUnlocker = (localStorage.getItem('achievementUnlocker') && JSON.parse(localStorage.getItem('achievementUnlocker'))) || [];
                sortedAndFilteredGames = achievementUnlocker.map(JSON.parse);
            }
            if (isQuery && inputValue && inputValue.trim().length > 0) {
                sortedAndFilteredGames = sortedAndFilteredGames.filter(item =>
                    item.game.name.toLowerCase().includes(inputValue.toLowerCase().trim())
                );
            }
            setFilteredGames(sortedAndFilteredGames);
            setVisibleGames(sortedAndFilteredGames.slice(0, gamesPerPage));
            setCurrentPage(1);
        }
    }, [gameList, favorites, cardFarming, achievementUnlocker, sortStyle, isQuery, inputValue]);

    useEffect(() => {
        const favorites = (localStorage.getItem('favorites') && JSON.parse(localStorage.getItem('favorites'))) || [];
        setFavorites(favorites.map(JSON.parse));
        const cardFarming = (localStorage.getItem('cardFarming') && JSON.parse(localStorage.getItem('cardFarming'))) || [];
        setCardFarming(cardFarming.map(JSON.parse));
        const achievementUnlocker = (localStorage.getItem('achievementUnlocker') && JSON.parse(localStorage.getItem('achievementUnlocker'))) || [];
        setAchievementUnlocker(achievementUnlocker.map(JSON.parse));
    }, []);

    useEffect(() => {
        const cardFarming = (localStorage.getItem('cardFarming') && JSON.parse(localStorage.getItem('cardFarming'))) || [];
        setCardFarming(cardFarming.map(JSON.parse));
    }, []);

    useEffect(() => {
        const achievementUnlocker = (localStorage.getItem('achievementUnlocker') && JSON.parse(localStorage.getItem('achievementUnlocker'))) || [];
        setAchievementUnlocker(achievementUnlocker.map(JSON.parse));
    }, []);

    useEffect(() => {
        const handleScroll = (event) => {
            const { scrollTop, scrollHeight, clientHeight } = event.target;
            if (scrollTop + clientHeight >= scrollHeight - 20) {
                const nextPage = currentPage + 1;
                const startIndex = (nextPage - 1) * gamesPerPage;
                const endIndex = startIndex + gamesPerPage;
                const newVisibleGames = filteredGames.slice(0, endIndex);
                if (newVisibleGames.length > visibleGames.length) {
                    setVisibleGames(newVisibleGames);
                    setCurrentPage(nextPage);
                }
            }
        };

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
            return () => scrollContainer.removeEventListener('scroll', handleScroll);
        }
    }, [gameList, currentPage, visibleGames, filteredGames, gamesPerPage]);

    const handleShowStats = () => {
        localStorage.setItem('showStats', !showStats);
        setShowStats(!showStats);
    };

    const handleScroll = (event) => {
        const { scrollTop, scrollHeight, clientHeight } = event.target;
        if (scrollTop + clientHeight >= scrollHeight - 20) {
            const nextPage = currentPage + 1;
            const startIndex = (nextPage - 1) * gamesPerPage;
            const endIndex = startIndex + gamesPerPage;
            const newVisibleGames = filteredGames.slice(0, endIndex);
            if (newVisibleGames.length > visibleGames.length) {
                setVisibleGames(newVisibleGames);
                setCurrentPage(nextPage);
            }
        }
    };

    if (isLoading) return <Loader />;

    if (!gameList) return <Private steamId={steamId} />;

    return (
        <React.Fragment>
            <div className='w-calc min-h-calc max-h-calc overflow-y-auto overflow-x-hidden' onScroll={handleScroll}>
                <div className='p-4'>
                    {!showAchievements && (
                        <PageHeader
                            activePage={activePage}
                            setActivePage={setActivePage}
                            sortStyle={sortStyle}
                            setSortStyle={setSortStyle}
                            showStats={showStats}
                            handleShowStats={handleShowStats}
                            filteredGames={filteredGames}
                            visibleGames={visibleGames}
                        />
                    )}

                    {activePage === 'games' ? (
                        <GameIdleList
                            gameList={visibleGames}
                            favorites={favorites}
                            cardFarming={cardFarming}
                            achievementUnlocker={achievementUnlocker}
                            setFavorites={setFavorites}
                            setCardFarming={setCardFarming}
                            setAchievementUnlocker={setAchievementUnlocker}
                            showStats={showStats}
                            showAchievements={showAchievements}
                            setShowAchievements={setShowAchievements}
                            setAppId={setAppId}
                        />
                    ) : (
                        <GameAchievementList
                            gameList={visibleGames}
                            favorites={favorites}
                            cardFarming={cardFarming}
                            achievementUnlocker={achievementUnlocker}
                            setFavorites={setFavorites}
                            setCardFarming={setCardFarming}
                            setAchievementUnlocker={setAchievementUnlocker}
                            showStats={showStats}
                            showAchievements={showAchievements}
                            setShowAchievements={setShowAchievements}
                            setAppId={setAppId}
                        />
                    )}
                </div>
            </div>
        </React.Fragment>
    );
}