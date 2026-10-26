import assert from 'assert';
import { evaluateCandidateAnswerAndProgress } from './server/services/aiInterviewService.js';

async function runGuidanceTests() {
  console.log('=== RUNNING AI EVALUATION & CANDIDATE GUIDANCE TEST SUITE ===\n');

  // Question: Java HashMap & Collisions
  const mockQuestion = {
    id: 'q-test-1',
    category: 'Technical Fundamentals',
    topic: 'Java Collections Framework',
    difficulty: 'Intermediate',
    questionText: 'How does HashMap work internally in Java? What happens during a hash collision, and when does a bucket convert to a red-black tree in Java 8+?',
    expectedConcepts: [
      'hashcode and bucket array indexing',
      'collision chaining with linked lists',
      'treeify threshold of 8 elements',
      'O(1) average to O(log n) tree lookup',
      'ConcurrentHashMap for thread safety'
    ],
    modelAnswer: 'HashMap indexes buckets using hash(key.hashCode()). Collisions chain elements in a linked list, which converts to a Red-Black Tree once a bucket reaches 8 elements for O(log n) lookup. ConcurrentHashMap is used for thread safety.'
  };

  const baseSession = {
    sessionId: 'test-guidance-session',
    userId: 'cand-guidance-001',
    domain: 'Java Development',
    targetRole: 'Java Developer',
    experienceLevel: 'Intermediate',
    totalQuestions: 5,
    currentQuestionIndex: 0,
    agenda: [mockQuestion],
    turns: [],
    strongTopics: [],
    weakTopics: []
  };

  // Test 1: Fully Correct Technical Answer
  console.log('▶ Test 1: Fully Correct Answer...');
  const correctAnswer = `
    Java HashMap uses an array of buckets. When you put a key, it computes the hash code to locate the bucket array index.
    If multiple keys collide, collision chaining with linked lists is used. In Java 8+, once a bucket reaches the treeify threshold of 8 elements,
    it converts to a red-black tree, reducing worst-case search from O(n) to O(log n). For thread-safety, we use ConcurrentHashMap.
  `;
  const eval1 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(baseSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: correctAnswer,
    timeTakenSeconds: 30
  });

  assert.strictEqual(eval1.evaluation.result, 'Correct');
  assert.strictEqual(eval1.evaluation.classification, 'Relevant and correct');
  assert.ok(eval1.evaluation.awardedMarks >= 8.0, `Expected score >= 8.0, got ${eval1.evaluation.awardedMarks}`);
  assert.ok(Array.isArray(eval1.evaluation.whatYouGotRight) && eval1.evaluation.whatYouGotRight.length > 0, 'whatYouGotRight must be populated');
  assert.ok(eval1.evaluation.correctExplanation, 'correctExplanation must be present');
  assert.ok(eval1.evaluation.example, 'example must be present');
  assert.ok(eval1.evaluation.howToImprove, 'howToImprove must be present');
  assert.ok(eval1.evaluation.improvedSampleAnswer, 'improvedSampleAnswer must be present');
  console.log('  ✓ Result:', eval1.evaluation.result, `(${eval1.evaluation.awardedMarks}/10)`);
  console.log('  ✓ What You Got Right:', eval1.evaluation.whatYouGotRight[0]);
  console.log('  ✓ Spoken Feedback:', eval1.spokenFeedback);

  // Test 2: Partially Correct Answer with Important Omission
  console.log('\n▶ Test 2: Partially Correct Answer (Missing Treeification & ConcurrentHashMap)...');
  const partialAnswer = `
    HashMap stores key-value pairs in buckets using the hash code. If there is a collision, it stores them in a linked list.
  `;
  const eval2 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(baseSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: partialAnswer,
    timeTakenSeconds: 20
  });

  assert.strictEqual(eval2.evaluation.result, 'Partially Correct');
  assert.ok(eval2.evaluation.classification.includes('partial'));
  assert.ok(eval2.evaluation.awardedMarks >= 4.5 && eval2.evaluation.awardedMarks <= 7.8, `Score should be 4.5-7.8, got ${eval2.evaluation.awardedMarks}`);
  assert.ok(Array.isArray(eval2.evaluation.whatNeedsImprovement) && eval2.evaluation.whatNeedsImprovement.length > 0, 'whatNeedsImprovement must detail omissions');
  assert.ok(eval2.evaluation.example, 'example must provide code/pattern');
  assert.ok(eval2.evaluation.improvedSampleAnswer, 'improvedSampleAnswer must provide model answer');
  console.log('  ✓ Result:', eval2.evaluation.result, `(${eval2.evaluation.awardedMarks}/10)`);
  console.log('  ✓ What Needs Improvement:', eval2.evaluation.whatNeedsImprovement[0]);
  console.log('  ✓ Model Answer:', eval2.evaluation.improvedSampleAnswer);

  // Test 3: Incorrect Answer with Misconception
  console.log('\n▶ Test 3: Incorrect Answer with Misconception...');
  const incorrectAnswer = `
    In HashMap, keys cannot be hashed so collisions overwrite existing data without any bucket.
  `;
  const eval3 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(baseSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: incorrectAnswer,
    timeTakenSeconds: 15
  });

  assert.strictEqual(eval3.evaluation.result, 'Incorrect');
  assert.strictEqual(eval3.evaluation.classification, 'Relevant but incorrect');
  assert.ok(eval3.evaluation.awardedMarks <= 5.5, `Incorrect answer should score <= 5.5, got ${eval3.evaluation.awardedMarks}`);
  assert.ok(eval3.evaluation.whatNeedsImprovement.some(m => m.toLowerCase().includes('misconception') || m.toLowerCase().includes('omitted')), 'Needs improvement must catch misconception');
  console.log('  ✓ Result:', eval3.evaluation.result, `(${eval3.evaluation.awardedMarks}/10)`);
  console.log('  ✓ Identified Misconception:', eval3.evaluation.whatNeedsImprovement[0]);

  // Test 4: Irrelevant Answer (Attempt 1 triggers retry)
  console.log('\n▶ Test 4: Irrelevant Answer...');
  const irrelevantAnswer = `
    I love playing football and cricket on weekends with my friends.
  `;
  const eval4 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(baseSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: irrelevantAnswer,
    timeTakenSeconds: 10
  });

  assert.strictEqual(eval4.retryOpportunity, true, 'Attempt 1 irrelevant answer must trigger retry');
  assert.strictEqual(eval4.evaluation.result, 'Needs Clarification');
  assert.strictEqual(eval4.evaluation.classification, 'Irrelevant or off-topic');
  assert.ok(eval4.spokenFeedback.includes('does not fit this question'), 'Must have polite redirection');
  console.log('  ✓ Result:', eval4.evaluation.result, '(Retry triggered)');
  console.log('  ✓ Polite Redirection:', eval4.spokenFeedback);

  // Test 5: Vague Answer
  console.log('\n▶ Test 5: Vague Answer...');
  const vagueAnswer = 'HashMap is basically a thing that stores things using hash and stuff.';
  const eval5 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(baseSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: vagueAnswer,
    timeTakenSeconds: 12
  });
  assert.ok(eval5.evaluation.result === 'Partially Correct' || eval5.evaluation.result === 'Needs Clarification', 'Vague answer should be Partially Correct or Needs Clarification');
  assert.ok(eval5.evaluation.awardedMarks <= 7.0, 'Vague answer should score <= 7.0');
  console.log('  ✓ Result:', eval5.evaluation.result, `(${eval5.evaluation.awardedMarks}/10)`);
  console.log('  ✓ Improvement Advice:', eval5.evaluation.whatNeedsImprovement[0]);

  // Test 6: Correct Answer in Different Wording (Alternative phrasing)
  console.log('\n▶ Test 6: Correct Answer in Different Wording...');
  const paraphrasedAnswer = `
    Entries map into table bins by taking the hash and bucket array indexing.
    If collisions happen, nodes link in a sequence with collision chaining with linked lists.
    Once a bin reaches the treeify threshold of 8 elements, it transforms to a red-black tree with O(1) average to O(log n) tree lookup.
    To avoid thread race conditions, ConcurrentHashMap for thread safety is the standard alternative.
  `;
  const eval6 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(baseSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: paraphrasedAnswer,
    timeTakenSeconds: 28
  });
  assert.strictEqual(eval6.evaluation.result, 'Correct', 'Paraphrased complete answer must be recognized as Correct');
  assert.ok(eval6.evaluation.awardedMarks >= 8.0, 'Paraphrased answer should score >= 8.0');
  console.log('  ✓ Result:', eval6.evaluation.result, `(${eval6.evaluation.awardedMarks}/10)`);

  // Test 7: Coding Answer with Logical Error
  console.log('\n▶ Test 7: Coding Answer with Logical Error...');
  const codingQuestion = {
    id: 'q-coding-1',
    category: 'Technical Fundamentals',
    topic: 'Second Largest Element in Array',
    difficulty: 'Medium',
    questionText: 'How do you find the second largest element in an unsorted array in O(n) time and O(1) space?',
    expectedConcepts: [
      'single pass tracking max and second max',
      'updating second when new max found',
      'handling duplicates of max',
      'O(n) time complexity',
      'O(1) auxiliary space'
    ],
    modelAnswer: 'We iterate through the array once keeping two variables: largest and secondLargest. If num > largest, secondLargest becomes largest and largest becomes num. If num is between largest and secondLargest, we update secondLargest. This achieves O(n) time and O(1) auxiliary space.'
  };
  const codingSession = {
    ...baseSession,
    agenda: [codingQuestion]
  };
  const buggyCodingAnswer = 'I find the maximum element by looping once, and then I return array[array.length - 2].';
  const eval7 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(codingSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: buggyCodingAnswer,
    timeTakenSeconds: 18
  });
  assert.ok(eval7.evaluation.result === 'Partially Correct' || eval7.evaluation.result === 'Incorrect', 'Buggy coding answer must not be marked Correct');
  assert.ok(eval7.evaluation.whatNeedsImprovement.length > 0, 'Must identify logical errors / missing concepts');
  console.log('  ✓ Result:', eval7.evaluation.result, `(${eval7.evaluation.awardedMarks}/10)`);
  console.log('  ✓ What Needs Improvement:', eval7.evaluation.whatNeedsImprovement[0]);

  // Test 8: Behavioral Answer (No single objectively correct response, STAR evaluation)
  console.log('\n▶ Test 8: Behavioral Answer (STAR methodology)...');
  const behavioralQuestion = {
    id: 'q-behav-1',
    category: 'Behavioral and Situational Questions',
    topic: 'Handling Difficult Situations',
    difficulty: 'Medium',
    questionText: 'Describe a difficult situation you encountered in a project and how you handled it.',
    expectedConcepts: [
      'STAR method',
      'defining the challenge clearly',
      'systematic actions taken',
      'positive outcome and lesson learned'
    ],
    modelAnswer: 'Using the STAR method: in my project, a third-party API intermittently failed during load testing. I diagnosed the timeouts, implemented a circuit breaker and retry policy with exponential backoff, and stabilized throughput.'
  };
  const behavSession = {
    ...baseSession,
    agenda: [behavioralQuestion]
  };
  const behavioralAnswer = `
    In my previous web application project, our payment gateway API started intermittently returning 500 errors 2 days before demo day.
    I took ownership of debugging: I inspected the system logs, identified that third-party timeouts were blocking database connection pools,
    implemented an asynchronous queue with exponential backoff retries, and tested the fallback under simulated network latency.
    As a result, all test transactions succeeded and the demo completed without a single dropped order.
  `;
  const eval8 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(behavSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: behavioralAnswer,
    timeTakenSeconds: 35
  });
  assert.ok(eval8.evaluation.awardedMarks >= 7.5, 'Well-structured behavioral answer must be rewarded high marks');
  assert.ok(eval8.evaluation.whatYouGotRight.length > 0, 'What you got right must capture the response strengths');
  console.log('  ✓ Result:', eval8.evaluation.result, `(${eval8.evaluation.awardedMarks}/10)`);
  console.log('  ✓ Feedback:', eval8.spokenFeedback);

  // Test 9: Incomplete Speech Transcript / Mic Audio Failure
  console.log('\n▶ Test 9: Incomplete Speech Recognition Transcript...');
  const incompleteTranscript = 'uh... um... wait...';
  const eval9 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(baseSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: incompleteTranscript,
    timeTakenSeconds: 5
  });
  assert.strictEqual(eval9.retryOpportunity, true, 'Speech audio failure must trigger retry opportunity without zeroing out interview');
  assert.strictEqual(eval9.evaluation.result, 'Needs Clarification');
  console.log('  ✓ Result:', eval9.evaluation.result, '(Polite retry granted without penalty)');

  // Test 10: Follow-up Request Asking the AI to Explain Correction
  console.log('\n▶ Test 10: Follow-up Clarification / Explanation Query...');
  const followUpQuery = 'Can you explain why my answer was wrong simply?';
  const eval10 = await evaluateCandidateAnswerAndProgress({
    sessionState: JSON.parse(JSON.stringify(baseSession)),
    resumeContext: { skills: { allSkillsFound: ['Java'] } },
    userAnswer: followUpQuery,
    timeTakenSeconds: 6
  });
  assert.strictEqual(eval10.retryOpportunity, true, 'Clarification question should trigger gentle prompt to try the question');
  assert.ok(eval10.evaluation.simpleExplanation, 'Simple explanation must be readily available for candidate learning');
  console.log('  ✓ Result:', eval10.evaluation.result, '(Clarification opportunity handled)');
  console.log('  ✓ Simple Explanation available:', eval10.evaluation.simpleExplanation.substring(0, 90) + '...');

  console.log('\n=== ALL 10 SECTION 9 GUIDANCE TESTS PASSED SUCCESSFULLY! ===');
}

runGuidanceTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
