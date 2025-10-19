CREATE TABLE Dim_ReleaseDate (
  ReleaseDateID INT AUTO_INCREMENT PRIMARY KEY,
  ReleaseDate VARCHAR(255)
);

CREATE TABLE Dim_Sales (
  SalesID INT AUTO_INCREMENT PRIMARY KEY,
  EstimatedOwners VARCHAR(255),
  LaunchPrice INT
);

CREATE TABLE Dim_Platforms (
  PlatformID INT AUTO_INCREMENT PRIMARY KEY,
  Windows VARCHAR(255),
  Mac VARCHAR(255),
  Linux VARCHAR(255)
);

CREATE TABLE Dim_Playtime (
  PlaytimeID INT AUTO_INCREMENT PRIMARY KEY,
  PeakCCU INT,
  AvgPlaytimeForever INT,
  AvgPlaytimeTwoWeeks INT,
  MedianPlaytimeForever INT,
  MedianPlaytimeTwoWeeks INT
);

CREATE TABLE Dim_Reviews (
  ReviewID INT AUTO_INCREMENT PRIMARY KEY,
  MetacriticScore INT,
  UserScore INT,
  Positive INT,
  Negative INT,
  ReviewsTotal INT,
  ReviewsScoreFancy INT
);

CREATE TABLE Fact_Game (
  GameID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(255),
  Tags VARCHAR(510),
  ReleaseDateID INT,
  SalesID INT,
  PlatformID INT,
  PlaytimeID INT,
  ReviewID INT,
  FOREIGN KEY (ReleaseDateID) REFERENCES Dim_ReleaseDate(ReleaseDateID),
  FOREIGN KEY (SalesID) REFERENCES Dim_Sales(SalesID),
  FOREIGN KEY (PlatformID) REFERENCES Dim_Platforms(PlatformID),
  FOREIGN KEY (PlaytimeID) REFERENCES Dim_Playtime(PlaytimeID),
  FOREIGN KEY (ReviewID) REFERENCES Dim_Reviews(ReviewID)
);

INSERT INTO Dim_ReleaseDate (ReleaseDate)
SELECT DISTINCT `Release date`
FROM Dim_Game
WHERE `Release date` IS NOT NULL;

INSERT INTO Dim_Sales (EstimatedOwners, LaunchPrice)
SELECT DISTINCT `Estimated owners`, `Launch Price`
FROM Dim_Game;

INSERT INTO Dim_Platforms (Windows, Mac, Linux)
SELECT DISTINCT `Windows`, `Mac`, `Linux`
FROM Dim_Game;

INSERT INTO Dim_Playtime (PeakCCU, AvgPlaytimeForever, AvgPlaytimeTwoWeeks, MedianPlaytimeForever, MedianPlaytimeTwoWeeks)
SELECT DISTINCT 
  `Peak CCU`,
  `Average playtime forever`,
  `Average playtime two weeks`,
  `Median playtime forever`,
  `Median playtime two weeks`
FROM Dim_Game;

INSERT INTO Dim_Reviews (MetacriticScore, UserScore, Positive, Negative, ReviewsTotal, ReviewsScoreFancy)
SELECT DISTINCT 
  `Metacritic score`,
  `User score`,
  `Positive`,
  `Negative`,
  `Reviews Total`,
  `Reviews Score Fancy`
FROM Dim_Game;

INSERT INTO Fact_Game (
  Name, Tags, ReleaseDateID, SalesID, PlatformID, PlaytimeID, ReviewID
)

SELECT 
  g.`Name`,
  g.`Tags`,
  d.ReleaseDateID,
  s.SalesID,
  p.PlatformID,
  t.PlaytimeID,
  r.ReviewID
FROM Dim_Game g
LEFT JOIN Dim_ReleaseDate d
  ON g.`Release date` = d.ReleaseDate
LEFT JOIN Dim_Sales s
  ON g.`Estimated owners` = s.EstimatedOwners
  AND g.`Launch Price` = s.LaunchPrice
LEFT JOIN Dim_Platforms p
  ON g.`Windows` = p.Windows
  AND g.`Mac` = p.Mac
  AND g.`Linux` = p.Linux
LEFT JOIN Dim_Playtime t
  ON g.`Peak CCU` = t.PeakCCU
  AND g.`Average playtime forever` = t.AvgPlaytimeForever
  AND g.`Average playtime two weeks` = t.AvgPlaytimeTwoWeeks
  AND g.`Median playtime forever` = t.MedianPlaytimeForever
  AND g.`Median playtime two weeks` = t.MedianPlaytimeTwoWeeks
LEFT JOIN Dim_Reviews r
  ON g.`Metacritic score` = r.MetacriticScore
  AND g.`User score` = r.UserScore
  AND g.`Positive` = r.Positive
  AND g.`Negative` = r.Negative
  AND g.`Reviews Total` = r.ReviewsTotal
  AND g.`Reviews Score Fancy` = r.ReviewsScoreFancy;
