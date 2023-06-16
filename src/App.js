import React, { useEffect, useState } from "react";
import { auth, db } from './fbase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import Community from './Community';
import Map from './Map';
import firebase from 'firebase/app';
import 'firebase/auth';


const { kakao } = window;

function App() {
  const [userData, setUserData] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [isFirstMapVisible, setIsFirstMapVisible] = useState(true);
  const [isKakaoMapVisible, setIsKakaoMapVisible] = useState(true);
  const [map, setMap] = useState(null);

  function handleGoogleLogin() {
    const provider = new GoogleAuthProvider();
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
        setUserData(user);
        console.log(user);

        db.collection('users')
          .doc(user.uid)
          .set({
            displayName: user.displayName,
            email: user.email,
            uid: user.uid,
          })
          .then(() => {
            console.log('사용자 데이터 저장 완료');
          })
          .catch((error) => {
            console.error('사용자 데이터 저장 에러:', error);
          });
      })
      .catch((error) => {
        console.log(error);
      });
  }

  function handleLogout() {
    signOut(auth)
      .then(() => {
        setUserData(null);
        console.log('로그아웃 성공');
      })
      .catch((error) => {
        console.log('로그아웃 오류:', error);
      });
  }

  function handleRegionSelect(regionName) {
    setSelectedRegion(regionName);
  }

  function handleMapBack() {
    setSelectedRegion(null);
  }

  const hideMarkers = () => {
    markers.forEach(marker => {
      marker.setMap(null);
    });
  };

  const showMarkers = () => {
    markers.forEach(marker => {
      marker.setMap(map);
    });
  };

  const deleteMarkers = () => {
    markers.forEach(marker => {
      marker.setMap(null);
    });
    setMarkers([]);
  };

  useEffect(() => {
    const mapContainer = document.getElementById('map');
    const mapOptions = { 
      center: new kakao.maps.LatLng(33.450701, 126.570667),
      level: 3
    };

    const mapInstance = new kakao.maps.Map(mapContainer, mapOptions);
    setMap(mapInstance);

    kakao.maps.event.addListener(mapInstance, 'click', function(mouseEvent) {        
      addMarker(mouseEvent.latLng);             
    });

    function addMarker(position) {
      const marker = new kakao.maps.Marker({
        position: position
      });

      marker.setMap(mapInstance);
      setMarkers(prevMarkers => [...prevMarkers, marker]);
    }

    return () => {
      hideMarkers();
    };
  }, []);

  const toggleFirstMapVisibility = () => {
    setIsFirstMapVisible(prevState => !prevState);
  };

  const toggleKakaoMapVisibility = () => {
    setIsKakaoMapVisible(prevState => !prevState);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>나만의 코스</h1>
      {userData ? (
        <div>
          <button style={styles.button} onClick={handleLogout}>
            로그아웃
          </button>
          <h2 style={styles.welcome}>
            {userData.displayName}님, 환영합니다!
          </h2>
          {selectedRegion ? (
            <Community selectedRegion={selectedRegion} user={userData} onBack={handleMapBack} />
          ) : (
            <div style={styles.mapContainer}>
              {isFirstMapVisible && <Map onSelectRegion={handleRegionSelect} />}
              <button style={styles.customButton} onClick={toggleFirstMapVisibility}>
                {isFirstMapVisible ? '첫 번째 지도 감추기' : '첫 번째 지도 보이기'}
              </button>
              <button style={styles.customButton} onClick={toggleKakaoMapVisibility}>
                {isKakaoMapVisible ? '카카오 맵 감추기' : '카카오 맵 보이기'}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div>
          <button style={styles.button} onClick={handleGoogleLogin}>
            로그인
          </button>
          <h2 style={styles.loginRequired}>로그인이 필요합니다.</h2>
        </div>
      )}
      <div>
        <div id="map" style={{ width: '500px', height: '500px', display: isKakaoMapVisible ? 'block' : 'none' }}></div>
        <button style={{ ...styles.customButton, marginRight: '10px' }} onClick={hideMarkers}>마커 감추기</button>
        <button style={{ ...styles.customButton, marginRight: '10px' }} onClick={showMarkers}>마커 보이기</button>
        <button style={styles.customButton} onClick={deleteMarkers}>마커 삭제하기</button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: '#F9F9F9',
    padding: '20px',
    textAlign: 'center',
    fontFamily: 'Arial, sans-serif',
  },
  header: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '20px',
  },
  button: {
    backgroundColor: '#FF6B6B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '4px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '20px',
  },
  welcome: {
    fontSize: '20px',
    marginBottom: '20px',
  },
  loginRequired: {
    fontSize: '20px',
    marginBottom: '20px',
    color: '#FF6B6B',
  },
  mapContainer: {
    width: '500px',
    height: '400px',
    margin: '0 auto',
  },
  customButton: {
    backgroundColor: '#FFC3A0',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '20px',
    padding: '10px 20px',
    fontSize: '16px',
    cursor: 'pointer',
    marginBottom: '10px',
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    transition: 'background-color 0.3s, transform 0.3s',
  },
};

export default App;