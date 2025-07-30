import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { UnitsService } from "./units.service";
import { CreateUnitDto } from "./dto/create-unit.dto";
import { UpdateUnitDto } from "./dto/update-unit.dto";
import { UpdateUnitStatusDto } from "./dto/update-unit-status.dto";
import { CognitoAuthGuard } from "../auth/guards/cognito-auth.guard";
import { UnitStatus } from "../database/models/unit.model";
import { ErrorResponseDto } from "../common/dto/error-response.dto";

@ApiTags("Units")
@Controller("units")
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new unit" })
  @ApiResponse({ status: 201, description: "Unit successfully created" })
  @ApiResponse({ status: 400, description: "Bad request" })
  @ApiResponse({
    status: 409,
    description: "Unit already exists",
    type: ErrorResponseDto,
  })
  create(@Body() createUnitDto: CreateUnitDto) {
    return this.unitsService.create(createUnitDto);
  }

  // @Get()
  // // @UseGuards(CognitoAuthGuard)
  // @ApiBearerAuth()
  // @ApiOperation({ summary: 'Get all units with pagination' })
  // @ApiQuery({ name: 'page', required: false, type: Number })
  // @ApiQuery({ name: 'limit', required: false, type: Number })
  // @ApiQuery({ name: 'status', required: false, enum: UnitStatus })
  // @ApiResponse({ status: 200, description: 'Units retrieved successfully' })
  // findAll(
  //   @Query('page', ParseIntPipe) page: number = 1,
  //   @Query('limit', ParseIntPipe) limit: number = 10,
  //   @Query('status') status?: UnitStatus,
  // ) {

  //   console.log("status ===>", status);

  //   return this.unitsService.findAll(page, limit, status);
  // }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all units with pagination" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "status", required: false, enum: UnitStatus })
  @ApiResponse({ status: 200, description: "Units retrieved successfully" })
  findAll(
    @Query("page", ParseIntPipe) page: number = 1,
    @Query("limit", ParseIntPipe) limit: number = 10,
    @Query("status") status?: any
  ) {

    console.log("status vv ===>", status);
    
    return this.unitsService.findAll(page, limit, status);
  }

  @Get("approved")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get all approved units for dropdown" })
  @ApiResponse({ status: 200, description: "Approved units retrieved successfully" })
  getApproved() {
    return this.unitsService.getApprovedUnits();
  }

  @Get("search")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Search units" })
  @ApiQuery({ name: "q", required: true, type: String })
  @ApiResponse({ status: 200, description: "Units found" })
  search(@Query("q") query: string) {
    return this.unitsService.searchUnits(query);
  }

  @Get(":id")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get unit by ID" })
  @ApiResponse({ status: 200, description: "Unit retrieved successfully" })
  @ApiResponse({ status: 404, description: "Unit not found" })
  findOne(@Param("id", ParseIntPipe) id: number) {
    return this.unitsService.findOne(id);
  }

  @Patch(":id")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update unit" })
  @ApiResponse({ status: 200, description: "Unit updated successfully" })
  @ApiResponse({ status: 404, description: "Unit not found" })
  update(@Param("id", ParseIntPipe) id: number, @Body() updateUnitDto: UpdateUnitDto) {
    return this.unitsService.update(id, updateUnitDto);
  }

  @Patch(":id/status")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update unit status" })
  @ApiResponse({ status: 200, description: "Unit status updated successfully" })
  @ApiResponse({ status: 404, description: "Unit not found" })
  updateStatus(@Param("id", ParseIntPipe) id: number, @Body() updateUnitStatusDto: UpdateUnitStatusDto) {
    return this.unitsService.updateStatus(id, updateUnitStatusDto.status);
  }

  @Post("bulk-status")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Bulk update unit status" })
  @ApiResponse({ status: 200, description: "Units status updated successfully" })
  bulkUpdateStatus(@Body() body: { ids: number[]; status: UnitStatus }) {
    return this.unitsService.bulkUpdateStatus(body.ids, body.status);
  }

  @Delete(":id")
  // @UseGuards(CognitoAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete unit" })
  @ApiResponse({ status: 200, description: "Unit deleted successfully" })
  @ApiResponse({ status: 404, description: "Unit not found" })
  remove(@Param("id", ParseIntPipe) id: number) {
    return this.unitsService.remove(id);
  }
}
