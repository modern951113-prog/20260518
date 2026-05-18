let video;
let handPose;
let hands = [];
let gameStarted = false;
let currentGesture = "";
let cuteImg; // 宣告圖片變數
// 新增遊戲狀態與計分變數
let gameState = 0; // 0: 偵測中, 1: 倒數中, 2: 單局結果, 3: 最終結算
let countdownStart = 0;
let lockedGesture = "";
let computerGesture = "";
let matchResult = "";
let playerScore = 0;
let computerScore = 0;

function preload() {
  // 載入 ml5.js 的 handPose 手部追蹤模型
  handPose = ml5.handPose();
  // 載入資料夾內的可愛圖片，副檔名改為 png
  cuteImg = loadImage(encodeURI('可愛.png'), 
    () => console.log("圖片載入成功"),
    (err) => console.warn("圖片載入失敗，請檢查檔名是否為 '可愛.png' 且位於同目錄", err)
  );
}

function setup() {
  // 建立全螢幕的畫布
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('display', 'block'); // 消除預設 inline 產生的底部留白
  document.body.style.margin = '0'; // 消除瀏覽器預設邊距，確保完美置中
  document.body.style.overflow = 'hidden'; // 隱藏捲軸
  
  // 擷取攝影機影像
  video = createCapture(VIDEO);
  // 隱藏原本預設的 HTML 影片元素，讓我們只在畫布上自己繪製它
  video.hide();
  
  // 開始持續偵測攝影機影像中的手部
  handPose.detectStart(video, gotHands);
}

// 取得手部偵測結果的回呼函式
function gotHands(results) {
  hands = results;
}

function draw() {
  background(255, 182, 193); // 將背景顏色改為淡粉色
  
  // 依照題目要求，計算影像寬高 (寬 75%，高 50%)
  let vWidth = width * 0.75;
  let vHeight = height * 0.5;
  
  push();
  // 將畫布的座標原點移至畫面正中心
  translate(width / 2, height / 2);
  
  // 左右顛倒影像 (X 軸縮放 -1，Y 軸保持 1)
  scale(-1, 1);
  
  // 設定圖片繪製模式為中心點對齊
  imageMode(CENTER);
  // 畫出攝影機影像，座標為 (0, 0) 即為畫面正中心
  image(video, 0, 0, vWidth, vHeight);
  pop();

  // 變更：將可愛圖片放大並顯示於右下角
  if (cuteImg && cuteImg.width > 0) { // 確保圖片有被正確載入才繪製
    imageMode(CORNER);
    // 將圖片放大，設定圖片高度為畫面高度的 30%，並等比例計算寬度
    let imgH = height * 0.30;
    let imgW = cuteImg.width * (imgH / cuteImg.height);
    // 放置在右下角，並預留 20px 的邊距
    let imgX = width - imgW - 20;
    let imgY = height - imgH - 20;
    image(cuteImg, imgX, imgY, imgW, imgH);
  }

  // 繪製遊戲狀態與手勢結果文字
  fill(255);
  stroke(0); // 加上黑色邊框，讓文字在淡粉色背景上更清楚
  strokeWeight(3);
  textAlign(CENTER, CENTER);
  
  if (!gameStarted) {
    textSize(32);
    text("點擊滑鼠或觸控螢幕以開始遊戲", width / 2, height * 0.15);
  } else {
    // 顯示左右兩側計分板
    textSize(32);
    textAlign(LEFT, TOP);
    text(`玩家分數：${playerScore} / 3`, 20, 20);
    textAlign(RIGHT, TOP);
    text(`電腦分數：${computerScore} / 3`, width - 20, 20);
    textAlign(CENTER, CENTER); // 恢復文字置中對齊

    currentGesture = "無法辨識";
    if (hands.length > 0) {
      currentGesture = detectGesture(hands[0]);
    }

    if (gameState === 0) {
      // 狀態 0：等待出拳
      textSize(32);
      text("遊戲進行中！請對著鏡頭出拳", width / 2, height * 0.15);
      
      textSize(48);
      fill(200);
      text("偵測中...", width / 2, height * 0.85); // 隱藏具體手勢
      
      if (currentGesture === "剪刀" || currentGesture === "石頭" || currentGesture === "布") {
        gameState = 1;
        lockedGesture = currentGesture;
        countdownStart = millis();
      }
    } else if (gameState === 1) {
      // 狀態 1：倒數 3 秒
      textSize(32);
      text("請保持手勢不要動...", width / 2, height * 0.15);
      
      if (currentGesture !== lockedGesture) {
        // 手勢改變或消失，視為中途更換，退回偵測狀態
        gameState = 0;
      } else {
        let elapsed = millis() - countdownStart;
        let remaining = Math.ceil((3000 - elapsed) / 1000);
        
        textSize(48);
        fill(255, 255, 0);
        text(`偵測成功！倒數 ${remaining} 秒`, width / 2, height * 0.85);
        
        if (elapsed >= 3000) {
          // 倒數 3 秒結束，系統隨機產生電腦手勢並結算
          gameState = 2;
          let gestures = ["剪刀", "石頭", "布"];
          computerGesture = random(gestures);
          matchResult = checkWinner(lockedGesture, computerGesture);
          
          if (matchResult === "玩家獲勝！") playerScore++;
          else if (matchResult === "電腦獲勝！") computerScore++;
        }
      }
    } else if (gameState === 2) {
      // 狀態 2：顯示單回合結果
      textSize(40);
      fill(255);
      text(`玩家：${lockedGesture}  VS  電腦：${computerGesture}`, width / 2, height * 0.15);
      
      textSize(64);
      if (matchResult.includes("玩家")) {
        fill(100, 255, 100);
      } else if (matchResult.includes("電腦")) {
        fill(255, 100, 100);
      } else {
        fill(255, 255, 100);
      }
      text(matchResult, width / 2, height * 0.5);
      
      textSize(24);
      fill(255);
      if (playerScore >= 3 || computerScore >= 3) {
        text("點擊滑鼠或觸控螢幕查看結算畫面", width / 2, height * 0.85);
      } else {
        text("點擊滑鼠或觸控螢幕繼續下一回合", width / 2, height * 0.85);
      }
    } else if (gameState === 3) {
      // 狀態 3：遊戲終局結算畫面
      textSize(64);
      if (playerScore >= 3) {
        fill(100, 255, 100);
        text("恭喜！你贏得了最終勝利！", width / 2, height * 0.15);
      } else {
        fill(255, 100, 100);
        text("電腦贏了！再接再厲！", width / 2, height * 0.15);
      }
      
      textSize(40);
      fill(255);
      text(`最終比分  玩家 ${playerScore} : ${computerScore} 電腦`, width / 2, height * 0.5);
      
      // 更新結算畫面的提示文字
      textSize(32);
      fill(255, 255, 100); // 黃色文字
      text("👉 比出「打勾(L)」手勢：繼續比賽", width / 2, height * 0.75);
      text("🤘 比出「搖滾(Rock)」手勢：結束並返回首頁", width / 2, height * 0.85);

      // 新增：偵測到對應手勢後觸發後續動作
      if (currentGesture === "繼續") {
        playerScore = 0;
        computerScore = 0;
        gameState = 0; // 繼續比賽，分數歸零並重置狀態
      } else if (currentGesture === "結束") {
        playerScore = 0;
        computerScore = 0;
        gameState = 0;
        gameStarted = false; // 結束比賽，返回初始點擊登入畫面
      }
    }
  }
}

// 點擊滑鼠開始遊戲
function mousePressed() {
  if (!gameStarted) {
    gameStarted = true;
  } else if (gameState === 2) {
    if (playerScore >= 3 || computerScore >= 3) {
      gameState = 3; // 進入結算畫面
    } else {
      gameState = 0; // 繼續下一回合
    }
  } else if (gameState === 3) {
    playerScore = 0;
    computerScore = 0;
    gameState = 0; // 重新開始新比賽
  }
}

// 觸控螢幕開始遊戲
function touchStarted() {
  if (!gameStarted) {
    gameStarted = true;
  } else if (gameState === 2) {
    if (playerScore >= 3 || computerScore >= 3) {
      gameState = 3; // 進入結算畫面
    } else {
      gameState = 0; // 繼續下一回合
    }
  } else if (gameState === 3) {
    playerScore = 0;
    computerScore = 0;
    gameState = 0; // 重新開始新比賽
  }
}

// 根據手指關節座標來判斷剪刀、石頭、布
function detectGesture(hand) {
  let kp = hand.keypoints;
  
  // 新增：判斷大拇指是否伸直（計算指尖到手腕的距離，大於拇指根部到手腕的距離代表伸直）
  let thumbDist = dist(kp[4].x, kp[4].y, kp[0].x, kp[0].y);
  let thumbBaseDist = dist(kp[2].x, kp[2].y, kp[0].x, kp[0].y);
  let isThumbOpen = thumbDist > thumbBaseDist;

  // 判斷食指、中指、無名指、小拇指是否伸直
  // 在影像中 Y 軸往下為正，因此指尖 (Tip) Y 座標小於第二指節 (PIP) Y 座標代表手指往上伸直
  let isIndexOpen = kp[8].y < kp[6].y;   // 食指
  let isMiddleOpen = kp[12].y < kp[10].y; // 中指
  let isRingOpen = kp[16].y < kp[14].y;   // 無名指
  let isPinkyOpen = kp[20].y < kp[18].y;  // 小拇指

  // 計算伸直的手指數量
  let openCount = 0;
  if (isIndexOpen) openCount++;
  if (isMiddleOpen) openCount++;
  if (isRingOpen) openCount++;
  if (isPinkyOpen) openCount++;

  // 新增：在結算畫面 (gameState === 3) 判斷特殊手勢
  if (gameState === 3) {
    // 打勾/手槍 (繼續)：拇指與食指伸直，其餘彎曲
    if (isThumbOpen && isIndexOpen && !isMiddleOpen && !isRingOpen && !isPinkyOpen) return "繼續";
    // 搖滾 (結束)：拇指、食指、小拇指伸直，中指與無名指彎曲
    if (isThumbOpen && isIndexOpen && !isMiddleOpen && !isRingOpen && isPinkyOpen) return "結束";
  }

  // 簡單的剪刀石頭布判定邏輯
  if (openCount === 0) return "石頭";
  if (openCount === 2 && isIndexOpen && isMiddleOpen) return "剪刀";
  if (openCount >= 4) return "布";
  
  return "無法辨識";
}

// 判斷勝負邏輯
function checkWinner(player, comp) {
  if (player === comp) return "平手！";
  if (
    (player === "剪刀" && comp === "布") ||
    (player === "石頭" && comp === "剪刀") ||
    (player === "布" && comp === "石頭")
  ) {
    return "玩家獲勝！";
  }
  return "電腦獲勝！";
}

// 當視窗大小改變時，動態調整畫布大小，維持全螢幕效果
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
