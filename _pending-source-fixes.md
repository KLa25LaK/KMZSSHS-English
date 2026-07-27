# Pending source fixes


## Speaking: skip next counts as wrong
In `custom-vocabulary-folders.tsx` `nextSpeakingQuestion`:
if current speaking word exists and feedback is not correct/hinted/wrong, call `recordSpeakingWrong(currentSpeaking.word)` before advancing.

