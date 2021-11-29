/*
* Author : NG-ZORRO - ANT UI
* Github : https://github.com/NG-ZORRO/ng-zorro-antd
* Copyright Reserved : MIT LICENSE
* Modified : Ace Revox
*/
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TooltipModule } from 'ngx-bootstrap/tooltip';
import { pgSliderHandleComponent } from './slider-handle.component';
import { pgSliderMarksComponent } from './slider-marks.component';
import { pgSliderStepComponent } from './slider-step.component';
import { pgSliderTrackComponent } from './slider-track.component';
import { pgSliderComponent } from './slider.component';
import { SliderService } from './slider.service';

@NgModule({
  exports: [ pgSliderComponent, pgSliderTrackComponent, pgSliderHandleComponent, pgSliderStepComponent, pgSliderMarksComponent ],
  declarations: [ pgSliderComponent, pgSliderTrackComponent, pgSliderHandleComponent, pgSliderStepComponent, pgSliderMarksComponent ],
  imports: [ CommonModule, TooltipModule ],
  providers: [ SliderService ]
})
export class pgSliderModule { }
