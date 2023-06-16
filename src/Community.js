import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { auth, db } from './fbase';
import { where } from 'firebase/firestore';
import RegionSelector from './RegionSelector';

function Community({ user, selectedRegion, onBack }) {
  const [posts, setPosts] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [region, setRegion] = useState('');
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [communityRegion, setCommunityRegion] = useState(null);
  const [noPosts, setNoPosts] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    let unsubscribe;
    if (selectedRegion) {
      const q = query(
        collection(db, 'posts'),
        where('region', '==', selectedRegion),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(q, (snapshot) => {
        setPosts(
          snapshot.docs.map((doc) => ({
            id: doc.id,
            post: doc.data(),
          }))
        );
      });
    }
    return () => unsubscribe && unsubscribe();
  }, [selectedRegion]);

  useEffect(() => {
    if (selectedPost) {
      const post = posts.find((post) => post.id === selectedPost);
      setIsLiked(post.post.likesBy && post.post.likesBy.includes(auth.currentUser.uid));
      setIsEditing(false);
    }
  }, [selectedPost, posts]);

  const handleCreatePost = () => {
    addDoc(collection(db, 'posts'), {
      title,
      content,
      region,
      likes: 0,
      comments: [],
      likesBy: [],
      author: {
        displayName: auth.currentUser.displayName,
        uid: auth.currentUser.uid,
      },
      createdAt: new Date(),
    })
      .then(() => {
        setTitle('');
        setContent('');
        setRegion('');
        setShowCreateForm(false);
      })
      .catch((error) => {
        console.error('Error creating post:', error);
      });
  };

  const handleCreateButtonClick = () => {
    setSelectedPost(null);
    setShowCreateForm(true);
  };

  const handleCancelButtonClick = () => {
    setSelectedPost(null);
    setShowCreateForm(false);
  };

  const handlePostClick = (postId) => {
    setSelectedPost(postId);
    setShowCreateForm(false);
  };

  const handleGoBack = () => {
    onBack();
  };

  const handleGoBack2 = () => {
    setSelectedPost(null);
    setShowCreateForm(false);
  };

  const handlePostDelete = async (selectedPost) => {
    const confirmMessage = `Are you sure you want to delete this post?\nTitle: ${
      selectedPost?.post?.title || ''
    }\nContent: ${selectedPost?.post?.content || ''}\nAuthor: ${
      selectedPost?.post?.author?.displayName || ''
    }\nTime: ${
      selectedPost?.post?.createdAt?.toDate().toLocaleString('ko-KR') || ''
    }`;

    if (window.confirm(confirmMessage)) {
      try {
        await deleteDoc(doc(db, 'posts', selectedPost.id));
        console.log('The post was successfully deleted.');
        setSelectedPost(null);
        setShowCreateForm(false);
      } catch (error) {
        console.error('Error deleting post:', error);
      }
    }
  };

  const handleSaveEdit = async (selectedPost) => {
    try {
      await updateDoc(doc(db, 'posts', selectedPost.id), {
        ...selectedPost.post,
        content: selectedPost.post.editedContent,
      });
      console.log('The post was successfully updated.');
      setPosts((prevPosts) =>
        prevPosts.map((prevPost) => {
          if (prevPost.id === selectedPost.id) {
            return {
              ...prevPost,
              post: {
                ...prevPost.post,
                content: selectedPost.post.editedContent,
                isEditing: false,
              },
            };
          }
          return prevPost;
        })
      );
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const handlePostEdit = (post) => {
    updateDoc(doc(db, 'posts', post.id), post)
      .then(() => {
        console.log('The post was successfully updated.');
      })
      .catch((error) => {
        console.error('Error updating post:', error);
      });
  };

  const handleRegionSelect = (regionName) => {
    setCommunityRegion(regionName);
  };

  const handleLikePost = async (postId) => {
    const postRef = doc(db, 'posts', postId);
    const postSnapshot = await getDoc(postRef);
    const postData = postSnapshot.data();

    // 이미 좋아요를 눌렀는지 확인
    if (postData.likesBy && postData.likesBy.includes(auth.currentUser.uid)) {
      // 좋아요를 취소하기 위해 해당 계정 제거
      const updatedLikesBy = postData.likesBy.filter((uid) => uid !== auth.currentUser.uid);

      // 좋아요 카운트 감소 및 좋아요 계정 업데이트
      await Promise.all([
        updateDoc(postRef, { likes: postData.likes - 1 }),
        updateDoc(postRef, { likesBy: updatedLikesBy }),
      ]);

      // 좋아요를 취소했을 때 상태 변경
      setIsLiked(false);
    } else {
      const updatedLikes = postData.likes + 1;

      // 좋아요 카운트 증가 및 해당 계정 추가
      await Promise.all([
        updateDoc(postRef, { likes: updatedLikes }),
        updateDoc(postRef, { likesBy: arrayUnion(auth.currentUser.uid) }),
      ]);

      // 좋아요를 눌렀을 때 상태 변경
      setIsLiked(true);
    }
  };

  const handleAddComment = async (postId, content) => {
    const comment = {
      content,
      author: {
        displayName: auth.currentUser.displayName,
        uid: auth.currentUser.uid,
      },
      createdAt: new Date(),
    };

    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, { comments: arrayUnion(comment) });

    // 댓글 작성 후 상태 초기화
    setCommentContent('');
  };

  return (
  <div style={styles.container}>
    {showCreateForm ? (
      <div style={styles.createForm}>
        <div style={styles.formGroup}>
          <label htmlFor="title">제목</label>
          <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="content">내용</label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          ></textarea>
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="region">지역</label>
          <RegionSelector value={region} onChange={(e) => setRegion(e.target.value)} />
        </div>
        <div style={styles.formButtons}>
          <button onClick={handleCreatePost} style={styles.button}>작성</button>
          <button onClick={handleCancelButtonClick} style={styles.button}>취소</button>
        </div>
      </div>
    ) : (
      <div>
        <div style={styles.createButtonContainer}>
          <button onClick={handleCreateButtonClick} style={styles.button}>게시글 작성</button>
        </div>
        {!selectedPost && selectedRegion && (
          <button onClick={handleGoBack} style={styles.button}>지도로 뒤로가기</button>
        )}
        {selectedPost ? (
          <div>
            <button onClick={handleGoBack2} style={styles.button}>코스로 뒤로가기</button>
            {posts
              .filter((post) => post.id === selectedPost)
              .map(({ id, post }) => (
                <div key={id} style={styles.postContainer}>
                  <h3 style={styles.postTitle}>{post.title}</h3>
                  <div style={styles.postContent}>
                    {!isEditing ? (
                      <p>{post.content}</p>
                    ) : (
                      <textarea
                        value={post.editedContent}
                        onChange={(e) =>
                          handlePostEdit({
                            ...post,
                            editedContent: e.target.value,
                          })
                        }
                      ></textarea>
                    )}
                  </div>
                  <div style={styles.postInfo}>
                    <p>작성자: {post.author.displayName}</p>
                    {post.region && <p>지역: {post.region}</p>}
                    {post.createdAt && (
                      <p>작성 시간: {new Date(post.createdAt.toDate()).toLocaleString('ko-KR')}</p>
                    )}
                  </div>
                  <div style={styles.actions}>
                    <button
                      onClick={() => handleLikePost(id)}
                      style={{
                        color: isLiked ? 'blue' : 'black',
                        fontWeight: isLiked ? 'bold' : 'normal',
                      }}
                    >
                      좋아요
                    </button>
                    <text>{post.likes}</text>

                    {/* 수정 및 삭제 버튼 추가 */}
                    {user && post.author.uid === user.uid && (
                      <React.Fragment>
                        <button onClick={() => handlePostDelete({ id, post })} style={styles.button}>삭제</button>
                        {!isEditing ? (
                          <button onClick={() => setIsEditing(true)} style={styles.button}>수정</button>
                        ) : (
                          <button onClick={() => handleSaveEdit({ id, post })} style={styles.button}>저장</button>
                        )}
                      </React.Fragment>
                    )}
                  </div>
                  <div style={styles.comments}>
                    <h3>댓글</h3>
                    {post.comments.map((comment, index) => (
                      <div key={index} style={styles.commentContainer}>
                        <p>{comment.content}</p>
                        <p>작성자: {comment.author.displayName}</p>
                        <p>작성 시간: {comment.createdAt.toDate().toLocaleString('ko-KR')}</p>
                        {index !== post.comments.length - 1 && (
                          <hr style={styles.commentSeparator} />
                        )}
                      </div>
                    ))}
                    <div style={styles.addCommentContainer}>
                      <input
                        type="text"
                        placeholder="댓글을 입력하세요."
                        value={commentContent}
                        onChange={(e) => setCommentContent(e.target.value)}
                        style={styles.commentInput}
                      />
                      <button onClick={() => handleAddComment(id, commentContent)} style={styles.button}>댓글 작성</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div>
            <div>
              <h2 style={styles.regionTitle}>{selectedRegion}의 코스</h2>
            </div>
            {noPosts ? (
              <p>해당 지역에 게시물이 없습니다.</p>
            ) : (
              posts.map(({ id, post }) => (
                <div
                  key={id}
                  style={styles.postPreviewContainer}
                  onClick={() => handlePostClick(id)}
                >
                  <h3>{post.title}</h3>
                  {post.region && <p>지역: {post.region}</p>}
                  {post.author && (
                    <p>
                      작성자: {post.author.displayName} ({post.author.uid})
                    </p>
                  )}
                  {post.createdAt && (
                    <p>작성 시간: {new Date(post.createdAt.toDate()).toLocaleString('ko-KR')}</p>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    )}
  </div>
);

}


const styles = {
  container: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: 'pink', // 귀여운 배경색
    borderRadius: '10px', // 귀여운 테두리 반경
    boxShadow: '0 0 10px rgba(0, 0, 0, 0.2)', // 귀여운 그림자 효과
    display: 'flex', // 컨테이너 안의 내용을 가운데로 정렬하려면 추가
    justifyContent: 'center', // 가로 방향 가운데 정렬
    alignItems: 'center', // 세로 방향 가운데 정렬
  },
  // 나머지 스타일들입니다...

  createForm: {
    marginBottom: '20px',
  },
  formGroup: {
    marginBottom: '10px',
  },
  formButtons: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButtonContainer: {
    marginBottom: '20px',
    backgroundColor: 'pink',
    borderRadius: '50%',
    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    fontSize: '12px',
    padding: '8px',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  postContainer: {
    marginBottom: '20px',
    border: '1px solid black',
    borderRadius: '5px',
    padding: '10px',
  },
  postTitle: {
    marginBottom: '10px',
  },
  postContent: {
    marginBottom: '10px',
  },
  postInfo: {
    marginBottom: '10px',
  },
  actions: {
    marginBottom: '10px',
  },
  comments: {
    marginTop: '20px',
    borderTop: '1px solid black',
    paddingTop: '20px',
  },
  commentContainer: {
    marginBottom: '10px',
  },
  commentSeparator: {
    margin: '10px 0',

    borderTop: '1px solid black',
  },
  addCommentContainer: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '10px',
  },
  commentInput: {
    marginRight: '10px',
  },
  regionTitle: {
    fontSize: '20px',
    marginBottom: '20px',
  },
  postPreviewContainer: {
    marginBottom: '20px',
    border: '1px solid black',
    borderRadius: '5px',
    padding: '10px',
    cursor: 'pointer',
  },
};

export default Community;
