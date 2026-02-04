// src/api/conversation.js

/**
 * 1. 대화 시작 (주제 선택 시 첫 질문 요청)
 */
export const startConversation = async (theme) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            let firstQuestion = "";
            
            switch (theme) {
                case 'DAILY': firstQuestion = "Hello! How are you feeling today?"; break;
                case 'TRAVEL': firstQuestion = "Where is the best place you have ever visited?"; break;
                case 'FOOD': firstQuestion = "What is your favorite Korean food?"; break;
                case 'SHOPPING': firstQuestion = "Do you prefer shopping online or in-store?"; break;
                case 'BUSINESS': firstQuestion = "Can you introduce yourself briefly?"; break;
                default: firstQuestion = "Let's start the conversation. Say hello!";
            }

            console.log(`[Mock API] 대화 시작 (테마: ${theme}, 질문: ${firstQuestion})`);
            resolve({
                type: "conversation",
                message: firstQuestion // 첫 질문
            });
        }, 800); // 0.8초 딜레이 (자연스럽게)
    });
};

/**
 * 2. 답변 전송 및 피드백/다음질문 수신 (기존과 동일하되 약간 다듬음)
 */
export const sendConversationAudio = async (audioBlob, theme) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            console.log(`[Mock API] 음성 전송됨 (테마: ${theme})`);
            
            resolve({
                type: "conversation",
                taskId: `CONV_${Date.now()}`,
                status: "SUCCESS",
                analysisResult: {
                    transScript: "I like pizza because it is delicious.",
                    nextTurn: "Oh, I love pizza too! What kind of toppings do you like?", // 꼬리 질문
                    theme: theme,
                    feedback: "잘하셨어요! 'delicious' 발음할 때 L 사운드를 조금 더 길게 끌어주면 자연스럽습니다."
                }
            });
        }, 1500);
    });
};
