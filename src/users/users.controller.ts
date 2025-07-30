import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserStatusDto } from "./dto/update-user-status.dto";
import { CognitoAuthGuard } from "../auth/guards/cognito-auth.guard";
import { ErrorResponseDto } from "../common/dto/error-response.dto";
import { SuccessResponseDto } from "../common/dto/success-response.dto";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new user" })
  @ApiResponse({ status: 201, description: "User successfully created" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "User already exists",
    type: ErrorResponseDto,
  })
  create(@Body() createUserDto: CreateUserDto, @Request() req) {
    return this.usersService.create({
      ...createUserDto,
    });
  }

  @Get()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all users with pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  findAll(@Query("page", ParseIntPipe) page: number = 1, @Query("limit", ParseIntPipe) limit: number = 10) {
    return this.usersService.findAll(page, limit);
  }

  @Get("search")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Search users" })
  @ApiQuery({ name: "q", required: true, type: String })
  @ApiResponse({ status: 200, description: "Users found" })
  search(@Query("q") query: string) {
    return this.usersService.searchUsers(query);
  }

  @Get("vendors")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all vendor users" })
  @ApiResponse({ status: 200, description: "Vendor users retrieved successfully" })
  getVendors() {
    return this.usersService.getVendorUsers();
  }

  @Get("by-type/:type")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get users by type" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  findByType(@Param("type") type: string) {
    return this.usersService.getUsersByType(type);
  }

  @Get(":id")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateUserDto: UpdateUserDto, @Request() req) {
    return this.usersService.update(id, updateUserDto);
  }

  @Patch(":id/status")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update user status" })
  @ApiResponse({ status: 200, description: "User status updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() updateUserStatusDto: UpdateUserStatusDto, @Request() req) {
    console.log("updateUserStatusDto ===>", updateUserStatusDto);
    
    return this.usersService.updateStatus(id, updateUserStatusDto.status, req?.user?.id, updateUserStatusDto?.remarks);
  }

  @Delete(":id")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete user" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.usersService.remove(id);
  }
}
