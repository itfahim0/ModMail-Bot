import assert from 'node:assert';
import { describe, it, mock } from 'node:test';

import replyCommand from './reply.js';

describe('Reply Command', () => {
    it('should send a reply and log it to repository', async () => {
        // Mock User
        const mockUser = {
            id: 'user-1',
            tag: 'User#1234',
            send: mock.fn(async () => {}),
        };

        // Mock Interaction
        const mockInteraction = {
            channelId: 'channel-1',
            channel: {
                name: 'ticket-1234',
                topic: 'User Ticket (123456)',
            },
            options: {
                getString: () => 'Hello',
            },
            user: {
                id: 'mod-1',
                tag: 'Staff#1234',
                displayAvatarURL: () => 'http://example.com/avatar.png',
            },
            client: {
                users: {
                    fetch: mock.fn(async () => mockUser),
                },
            },
            reply: mock.fn(async () => {}),
        };

        // Mock Repository
        const mockTicketRepo = {
            findByChannelId: mock.fn(async () => ({ id: 'ticket-1' })),
            addMessage: mock.fn(async () => {}),
        };

        // Execute
        await replyCommand.execute(mockInteraction as any, { ticketRepository: mockTicketRepo });

        // Verify user dm (Client.fetch calls user.send)
        assert.strictEqual(mockInteraction.client.users.fetch.mock.callCount(), 1);
        assert.strictEqual(mockUser.send.mock.callCount(), 1);

        // Verify repository interaction
        assert.strictEqual(mockTicketRepo.findByChannelId.mock.callCount(), 1);
        assert.strictEqual(mockTicketRepo.addMessage.mock.callCount(), 1);

        const addMessageArgs = mockTicketRepo.addMessage.mock.calls[0].arguments;
        assert.strictEqual(addMessageArgs[0], 'ticket-1');
        assert.deepStrictEqual(addMessageArgs[1], {
            senderId: 'mod-1',
            content: 'Hello',
        });

        // Verify confirmation reply
        assert.strictEqual(mockInteraction.reply.mock.callCount(), 1);
    });
});
