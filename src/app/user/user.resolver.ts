import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Parent, Query, ResolveProperty, Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { GraphqlGuard } from '../_helpers/graphql';
import { User as CurrentUser } from '../_helpers/graphql/user.decorator';
import { DeleteUserDto, UpdateUserDto } from './dto';
import { UserEntity } from './entity';
import { UserSubscriptionEntity } from './entity/user-subscription.entity';
import { UserService } from './user.service';

@Resolver('User')
@UseGuards(GraphqlGuard)
export class UserResolver {
  private pubSub = new PubSub();

  constructor(private readonly userService: UserService) {}

  @Query('me')
  async getMe(@CurrentUser() user: UserEntity): Promise<UserEntity> {
    return user;
  }

  @Mutation('deleteUser')
  async delete(@Args('deleteUserInput') args: DeleteUserDto): Promise<UserEntity> {
    const deletedUser = await this.userService.delete(args.id);
    await this.pubSub.publish('userDeleted', { userDeleted: deletedUser });
    return deletedUser;
  }

  @Mutation('updateUser')
  async update(@CurrentUser() user: UserEntity, @Args('updateUserInput') args: UpdateUserDto): Promise<UserEntity> {
    const updatedUser = await this.userService.patch(user.id.toString(), args);
    await this.pubSub.publish('userUpdated', { userUpdated: updatedUser });
    return updatedUser;
  }

  @Subscription('userCreated')
  userCreated() {
    return {
      subscribe: () => this.pubSub.asyncIterator('userCreated'),
    };
  }

  @Subscription('userDeleted')
  userDeleted() {
    return {
      subscribe: () => this.pubSub.asyncIterator('userDeleted'),
    };
  }

  @ResolveProperty('subscriptions')
  getHome(@Parent() user: UserEntity): Promise<UserSubscriptionEntity> {
    return this.userService.subscription.findOne({ where: { user: { eq: user.id.toString() } } });
  }
}
