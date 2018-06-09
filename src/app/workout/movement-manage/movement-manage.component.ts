import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { User } from '../../user/user.model';
import { UserService } from '../../user/user.service';
import { Movement } from '../movement.model';
import { WorkoutService } from '../workout.service';
import { ScrollPanelModule } from 'primeng/scrollpanel';
import { ChipsModule } from 'primeng/chips';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

@Component({
  selector: 'app-movement-manage',
  templateUrl: './movement-manage.component.html',
  styleUrls: ['./movement-manage.component.css']
})

export class MovementManageComponent implements OnInit, OnDestroy {
  public user: User;
  public movements: Movement[];
  public standardMovementsSubscription: Subscription;
  public trainerMovementsSubscription: Subscription;
  public filteredMovements: Movement[];
  public filterQuery: string[] = [];
  public activeMovement: Movement;
  public saveDisabled: boolean = true;
  public displayDeleteDialog: boolean = false;
  public movementToDelete: Movement;
  
  constructor(private router: Router, private userService: UserService, private workoutService: WorkoutService) { }

  ngOnInit() {
    this.user = this.userService.getActiveUser();
    if (!this.user) {
      this.router.navigate(['/', 'login']);
    } else {
      this.standardMovementsSubscription = this.workoutService.getStandardMovements().subscribe(standardMovements => {
        this.movements = standardMovements;
        this.trainerMovementsSubscription = this.workoutService.getTrainerMovements(this.user.id).subscribe(trainerMovements => {
          this.mergeMovements(trainerMovements);
          this.movements.sort((a, b) => a.name.localeCompare(b.name));
          this.filterMovements();
        });
      });
      this.activeMovement = new Movement(null, null, null, 'trainer');
    }
  }

  ngOnDestroy() {
    if (this.standardMovementsSubscription) this.standardMovementsSubscription.unsubscribe();
    if (this.trainerMovementsSubscription) this.trainerMovementsSubscription.unsubscribe();
  }

  public mergeMovements(trainerMovements: Movement[]): void {
    for (let i = 0; i < trainerMovements.length; i++) {
      for (let j = 0; j < this.movements.length; j++) {
        if (this.movements[j].id == trainerMovements[i].id) {
          this.movements.splice(j, 1);
          break;
        }
      }
      this.movements.push(trainerMovements[i]);
    }
  }

  public filterMovements(): void {
    if (this.filterQuery.length > 0) {
      this.filteredMovements.length = 0;
      for (let i = 0; i < this.movements.length; i++) {
        let matchCount = 0;
        for (let j = 0; j < this.filterQuery.length; j++) {
          if (this.movements[i].name.toLowerCase().indexOf(this.filterQuery[j].toLowerCase()) >= 0) matchCount++;
        }
        if (matchCount == this.filterQuery.length) this.filteredMovements.push(this.movements[i]);
      }
    } else {
      this.filteredMovements = this.movements.slice(0);
    }
  }

  public validateForm(): void {
    if ((this.activeMovement.name) && (this.activeMovement.youtubeID)) {
      this.saveDisabled = false;
    } else {
      this.saveDisabled = true;
    }
  }

  public saveMovement(): void {
    if (this.activeMovement.id) {
      this.workoutService.updateMovement(this.activeMovement, this.user.id);
    } else {
      this.workoutService.addMovement(this.activeMovement, this.user.id);
    }
    this.resetActiveMovement();
    this.saveDisabled = true;
  }

  public resetActiveMovement(): void {
    this.activeMovement.id = null;
    this.activeMovement.name = null;
    this.activeMovement.youtubeID = null;
    this.activeMovement.source = 'trainer';
  }

  public onEditMovement(movement: Movement): void {
    this.activeMovement.id = movement.id;
    this.activeMovement.name = movement.name;
    this.activeMovement.youtubeID = movement.youtubeID;
    this.activeMovement.source = movement.source;
  }

  public onDeleteTip(movement: Movement): void {
    this.workoutService.deleteMovement(movement, this.user.id);
  }

  public onClickDelete(movement: Movement): void {
    this.movementToDelete = movement;
    this.displayDeleteDialog = true;
  }

  public onDeleteConfirmation(): void {
    this.workoutService.deleteMovement(this.movementToDelete, this.user.id);
    this.displayDeleteDialog = false;
    for (let i = 0; i < this.movements.length; i++) {
      if (this.movements[i].id == this.movementToDelete.id) {
        this.movements.splice(i, 1);
        break;
      }
    }
    this.filterMovements();
  }

}
