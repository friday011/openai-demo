import OpenAI from "openai";

const openai = new OpenAI();

// Start below

/**
 * OpenAT tools
 */

const chatContext: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  {
    role: "system",
    content:
      "You are a helpful assistant that gives detailed information about the time of the day and the status of an order"
    // content: "You are a helpful bot that tells the current time"
  },
  {
    role: "user",
    content: "What is the status of the order number 3445?"
  }
];

const getTimeOfDay = () => {
  return "5:45 PM";
};

const getOrderStatus = (id: string) => {
  console.log(`Getting details of order: ${id}`);

  const orderId = parseInt(id);
  if (orderId % 2 === 0) {
    return "IN_PROGRESS";
  }

  return "COMPLETED";
};

const callOpenAIWithTools = async () => {
  try {
    // Step #1: Configure tool calls
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: chatContext,
      tools: [
        {
          type: "function",
          function: {
            name: "getTimeOfDay",
            description: "Get the time of the day"
          }
        },
        {
          type: "function",
          function: {
            name: "getOrderStatus",
            description: "Get status of an order",
            parameters: {
              type: "object",
              properties: {
                id: {
                  type: "string",
                  description: "The ID of the order to fetch the status of"
                }
              },
              required: ["id"]
            }
          }
        }
      ],
      tool_choice: "auto"
    });

    console.log("First response", JSON.stringify(response, null, 2));
    // console.log(response.choices[0].message.content);

    // Step #2: Decide if tool call is required
    const willInvokeToolCall =
      response.choices[0].finish_reason === "tool_calls";
    const wasMessageToolCall = response.choices[0].message.tool_calls;

    if (willInvokeToolCall) {
      if (wasMessageToolCall && wasMessageToolCall.length) {
        const toolCall = wasMessageToolCall[0];

        const toolName = toolCall.function.name;
        const toolId = toolCall.id;

        if (toolName === "getTimeOfDay") {
          const toolResponse = getTimeOfDay();

          chatContext.push(response.choices[0].message);
          chatContext.push({
            role: "tool",
            content: toolResponse,
            tool_call_id: toolId
          });
        }

        if (toolName === "getOrderStatus") {
          const rawArgument = toolCall.function.arguments;
          const args = JSON.parse(rawArgument);

          const toolResponse = getOrderStatus(args.id);

          chatContext.push(response.choices[0].message);
          chatContext.push({
            role: "tool",
            content: toolResponse,
            tool_call_id: toolId
          });
        }
      }
    }

    const secondResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: chatContext
    });

    console.log("Second response -", secondResponse.choices[0].message.content);
  } catch (error) {
    console.error("Something went wrong", error);
  }
};

callOpenAIWithTools();

/**
 * OpenAI command line chatbot with history
 */

// const chatContext: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
//   {
//     role: "system",
//     content: "You are a helpful chatbot"
//   }
// ];

// process.stdin.addListener("data", async input => {
//   const userInput = input.toString().trim();

//   // First we push the user input
//   chatContext.push({
//     role: "user",
//     content: userInput
//   });

//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: chatContext
//     });

//     const responseMessage = response.choices[0].message;

//     // Then we push the response with role assistant
//     chatContext.push({
//       role: "assistant",
//       content: responseMessage.content
//     });

//     console.log(
//       `Role: ${response.choices[0].message.role}: ${response.choices[0].message.content}`
//     );
//   } catch (error) {
//     console.error("Something went wrong", error);
//   }
// });

/**
 * Basic function showcasing a generic call to OpenAI
 */

// const main = async () => {
//   try {
//     const response = await openai.chat.completions.create({
//       model: "gpt-3.5-turbo",
//       messages: [
//         {
//           role: "system",
//           content: "You respond like a cool brother"
//         },
//         {
//           role: "user",
//           content: "How tall is Mount Everest?"
//         }
//       ]
//     });

//     console.log(response.choices[0].message.content);
//   } catch (error) {
//     console.error("Something went wrong", error);
//   }
// };

// main();
