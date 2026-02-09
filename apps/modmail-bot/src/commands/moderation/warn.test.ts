import assert from 'node:assert';
import { describe, it, mock } from 'node:test';

// Import the command
// We rely on the fact that we can pass dependencies to execute explicitly
import warnCommand from './warn.js';

describe('Warn Command', () => {
    it('should create a warning and reply to interaction', async () => {
        // Mock Interaction
        const mockUser = {
            id: 'user-1',
            tag: 'TestUser#1234',
            send: mock.fn(async () => {}),
        };

        const mockInteraction = {
            options: {
                getUser: () => mockUser,
                getString: () => 'Test Warning',
            },
            user: {
                id: 'mod-1',
                tag: 'Moderator#1234',
            },
            guild: {
                name: 'Test Guild',
                members: {
                    fetch: mock.fn(async () => ({ id: 'user-1' })),
                },
            },
            reply: mock.fn(async () => {}),
        };

        // Mock Dependencies
        const mockWarningRepo = {
            create: mock.fn(async () => ({
                id: 'warn-1',
                userId: 'user-1',
                moderatorId: 'mod-1',
                reason: 'Test Warning',
                createdAt: new Date(),
            })),
            findByUserId: mock.fn(async () => [
                {
                    id: 'warn-1',
                    userId: 'user-1',
                    moderatorId: 'mod-1',
                    reason: 'Test Warning',
                    createdAt: new Date(),
                },
            ]),
        };

        // Execute command with injected dependencies
        await warnCommand.execute(mockInteraction as any, { warningRepository: mockWarningRepo });

        // Verify repository calls
        assert.strictEqual(mockWarningRepo.create.mock.callCount(), 1);
        const createArgs = mockWarningRepo.create.mock.calls[0].arguments[0];
        assert.deepStrictEqual(createArgs, {
            userId: 'user-1',
            moderatorId: 'mod-1',
            reason: 'Test Warning',
        });

        // Verify interaction reply
        assert.strictEqual(mockInteraction.reply.mock.callCount(), 1);

        // Verify user dm calling
        assert.strictEqual(mockUser.send.mock.callCount(), 1);
    });
});
