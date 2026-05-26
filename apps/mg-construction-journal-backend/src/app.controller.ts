import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    root() {
        return { message: 'mg-construction-journal-backend', status: 'ok' };
    }
}
