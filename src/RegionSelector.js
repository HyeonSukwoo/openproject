import React from 'react';

function RegionSelector({ value, onChange }) {
  return (
    <div style={{ marginBottom: '10px' }}>
      <label htmlFor="region">지역 선택: </label>
      <select id="region" value={value} onChange={onChange}>
        <option disabled value="">-- 선택하세요 --</option>
        <option value="서울">서울</option>
        <option value="경기도">경기도</option>
        <option value="인천">인천</option>
        <option value="강원도">강원도</option>
        <option value="충청남도">충청남도</option>
        <option value="충청북도">충청북도</option>
        <option value="대전">대전</option>
        <option value="세종">세종</option>
        <option value="전라남도">전라남도</option>
        <option value="전라북도">전라북도</option>
        <option value="광주">광주</option>
        <option value="경상남도">경상남도</option>
        <option value="경상북도">경상북도</option>
        <option value="대구">대구</option>
        <option value="울산">울산</option>
        <option value="부산">부산</option>
        <option value="제주도">제주도</option>
      </select>
    </div>
  );
}

export default RegionSelector;
