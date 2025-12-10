package com.financial.statistics.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.financial.statistics.entity.Person;

@Repository
public interface PersonRepository extends JpaRepository<Person, Long> {

    @Query("SELECT person FROM Person person WHERE person.id = :id")
    Person getPersonById(Long id);

}
