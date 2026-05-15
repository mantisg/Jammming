import { useState } from 'react';

export default function SearchBar({ onSearch, isSearching }) {
  const [searchInput, setSearchInput] = useState('');

  const handleInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchClick = () => {
    onSearch(searchInput);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearchClick();
    }
  };

  return (
    <div className="SearchBar">
      <input
        placeholder="Enter A Song, Album, or Artist"
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        value={searchInput}
        type="text"
        id="search-input"
        name="search-input"
      />
      <button 
        className="SearchButton" 
        onClick={handleSearchClick}
        disabled={isSearching}
      >
        {isSearching ? 'SEARCHING...' : 'SEARCH'}
      </button>
    </div>
  );
}