let video;
let handPose;
let hands = [];
let gameStarted = false;
let currentGesture = "";
let cuteImg; // 宣告圖片變數

function preload() {
  // 載入 ml5.js 的 handPose 手部追蹤模型
  handPose = ml5.handPose();
  // 載入資料夾內的可愛圖片，加上 encodeURI 解決中文檔名 404 問題，並加上錯誤捕捉避免白畫面
  cuteImg = loadImage(encodeURI('可愛.jpg'), 
    () => console.log("圖片載入成功"),
    (err) => console.warn("圖片載入失敗，請檢查檔名是否為 '可愛.jpg' 且位於同目錄", err)
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

  // 新增：在影像辨識區下方顯示可愛圖片
  if (cuteImg && cuteImg.width > 0) { // 確保圖片有被正確載入才繪製
    imageMode(CENTER);
    // 設定圖片高度為畫面高度的 15%，並等比例計算寬度
    let imgH = height * 0.15;
    let imgW = cuteImg.width * (imgH / cuteImg.height);
    // 影像辨識區的底部 Y 座標 = (height / 2) + (vHeight / 2)
    // 往下加上半個圖片高與 20px 的間隔，讓它恰好出現在下方
    let imgY = (height / 2) + (vHeight / 2) + (imgH / 2) + 20;
    image(cuteImg, width / 2, imgY, imgW, imgH);
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
    textSize(32);
    text("遊戲進行中！請對著鏡頭出拳", width / 2, height * 0.15);
    
    // 如果有偵測到手，進行判定
    if (hands.length > 0) {
      currentGesture = detectGesture(hands[0]);
      textSize(64);
      fill(255, 255, 0); // 黃色文字
      text("偵測出拳：" + currentGesture, width / 2, height * 0.85);
    } else {
      textSize(32);
      fill(200);
      text("尋找手部中...", width / 2, height * 0.85);
    }
  }
}

// 點擊滑鼠開始遊戲
function mousePressed() {
  if (!gameStarted) {
    gameStarted = true;
  } else if (gameState === 2) {
    gameState = 0; // 重新開始
  }
}

// 觸控螢幕開始遊戲
function touchStarted() {
  if (!gameStarted) {
    gameStarted = true;
  } else if (gameState === 2) {
    gameState = 0; // 重新開始
  }
}

// 根據手指關節座標來判斷剪刀、石頭、布
function detectGesture(hand) {
  let kp = hand.keypoints;
  
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
